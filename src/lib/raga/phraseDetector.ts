import { NoteEvent } from '@/types/music';
import { Phrase, PhraseDirection } from '@/types/raga';
import { SWAR_LIST } from '@/lib/noteMapper';

export interface PhraseDetectorConfig {
  silenceGapMs: number;
  holdMultiplier: number;
  velocityDropRatio: number;
  minPhraseLengthNotes: number;
}

export const DEFAULT_PHRASE_CONFIG: PhraseDetectorConfig = {
  silenceGapMs: 300,
  holdMultiplier: 2.0,
  velocityDropRatio: 0.4,
  minPhraseLengthNotes: 2,
};

export interface PhraseDetectorCallbacks {
  onPhraseComplete: (phrase: Phrase) => void;
  onPhraseUpdate: (currentPhrase: Phrase) => void;
}

function octaveOffset(octave: string): number {
  if (octave === 'mandra') return -1;
  if (octave === 'taar') return 1;
  return 0;
}

function swarPitch(event: NoteEvent): number {
  return octaveOffset(event.octave) * 12 + SWAR_LIST.indexOf(event.swar);
}

function computeDirection(notes: NoteEvent[]): PhraseDirection {
  if (notes.length < 2) return 'mixed';
  const firstPitch = swarPitch(notes[0]);
  const lastPitch = swarPitch(notes[notes.length - 1]);
  const diff = lastPitch - firstPitch;
  if (diff > 2) return 'ascending';
  if (diff < -2) return 'descending';
  return 'mixed';
}

function computeEmphasis(notes: NoteEvent[]): import('@/types/music').Swar | null {
  if (notes.length === 0) return null;
  let best = notes[0];
  let bestScore = 0;
  for (const n of notes) {
    const dur = Math.max(n.duration ?? 200, 200);
    const score = n.velocity * dur;
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best.swar;
}

function buildPhrase(notes: NoteEvent[]): Phrase {
  const lastNote = notes[notes.length - 1];
  const lastEnd = lastNote.duration != null
    ? lastNote.timestamp + lastNote.duration
    : lastNote.timestamp;

  const swarSet = new Set<number>();
  for (const n of notes) {
    swarSet.add(SWAR_LIST.indexOf(n.swar));
  }

  return {
    notes: [...notes],
    direction: computeDirection(notes),
    startTime: notes[0].timestamp,
    endTime: lastEnd,
    emphasis: computeEmphasis(notes),
    landingNote: lastNote.swar,
    swarSet,
  };
}

export function createPhraseDetector(
  callbacks: PhraseDetectorCallbacks,
  config?: Partial<PhraseDetectorConfig>
) {
  let cfg: PhraseDetectorConfig = { ...DEFAULT_PHRASE_CONFIG, ...config };
  let currentNotes: NoteEvent[] = [];
  let completedPhrases: Phrase[] = [];
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearSilenceTimer() {
    if (silenceTimer !== null) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }

  function startSilenceTimer() {
    clearSilenceTimer();
    silenceTimer = setTimeout(() => {
      if (currentNotes.length >= cfg.minPhraseLengthNotes) {
        closeCurrentPhrase();
      } else if (currentNotes.length > 0) {
        // Too short — discard
        currentNotes = [];
      }
    }, cfg.silenceGapMs);
  }

  function closeCurrentPhrase() {
    clearSilenceTimer();
    if (currentNotes.length < cfg.minPhraseLengthNotes) {
      currentNotes = [];
      return;
    }
    const phrase = buildPhrase(currentNotes);
    completedPhrases.push(phrase);
    callbacks.onPhraseComplete(phrase);
    currentNotes = [];
  }

  function getAverageDuration(): number {
    const withDuration = currentNotes.filter((n) => n.duration != null);
    if (withDuration.length === 0) return 0;
    return withDuration.reduce((sum, n) => sum + (n.duration ?? 0), 0) / withDuration.length;
  }

  function getRecentAvgVelocity(): number {
    const recent = currentNotes.slice(-4);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, n) => sum + n.velocity, 0) / recent.length;
  }

  function feedNote(event: NoteEvent) {
    clearSilenceTimer();

    if (currentNotes.length > 0) {
      const prev = currentNotes[currentNotes.length - 1];
      const prevEnd = prev.duration != null
        ? prev.timestamp + prev.duration
        : prev.timestamp;
      const gap = event.timestamp - prevEnd;

      // Silence gap boundary
      if (prev.duration != null && gap > cfg.silenceGapMs) {
        closeCurrentPhrase();
      } else if (prev.duration == null && event.timestamp - prev.timestamp > cfg.silenceGapMs * 2) {
        // Overlapping notes — use larger threshold
        closeCurrentPhrase();
      }

      // Velocity drop boundary (secondary signal, only if phrase has 3+ notes)
      if (currentNotes.length >= 3) {
        const avgVel = getRecentAvgVelocity();
        if (avgVel > 0 && event.velocity < avgVel * cfg.velocityDropRatio) {
          closeCurrentPhrase();
        }
      }
    }

    currentNotes.push(event);
    callbacks.onPhraseUpdate(buildPhrase(currentNotes));
    startSilenceTimer();
  }

  function updateNoteDuration(midiNote: number, duration: number) {
    // Update the matching note in currentNotes
    for (let i = currentNotes.length - 1; i >= 0; i--) {
      if (currentNotes[i].midiNote === midiNote && currentNotes[i].duration === null) {
        currentNotes[i] = { ...currentNotes[i], duration };
        break;
      }
    }

    // Check hold boundary: if this note's duration is much longer than average
    if (currentNotes.length >= 3) {
      const avg = getAverageDuration();
      if (avg > 0 && duration > avg * cfg.holdMultiplier) {
        closeCurrentPhrase();
        return;
      }
    }

    // Update the silence timer based on the note end
    startSilenceTimer();
    if (currentNotes.length > 0) {
      callbacks.onPhraseUpdate(buildPhrase(currentNotes));
    }
  }

  function flush() {
    clearSilenceTimer();
    if (currentNotes.length >= cfg.minPhraseLengthNotes) {
      closeCurrentPhrase();
    } else {
      currentNotes = [];
    }
  }

  function getCurrentPhrase(): Phrase | null {
    if (currentNotes.length === 0) return null;
    return buildPhrase(currentNotes);
  }

  function getCompletedPhrases(): Phrase[] {
    return completedPhrases;
  }

  function reset() {
    clearSilenceTimer();
    currentNotes = [];
    completedPhrases = [];
  }

  function setConfig(newConfig: Partial<PhraseDetectorConfig>) {
    cfg = { ...cfg, ...newConfig };
  }

  return {
    feedNote,
    updateNoteDuration,
    flush,
    getCurrentPhrase,
    getCompletedPhrases,
    reset,
    setConfig,
  };
}
