import { NoteEvent } from '@/types/music';
import {
  RagaState,
  Phrase,
  MelodicRegion,
  EnergyLevel,
  MusicalPhase,
  PulseState,
} from '@/types/raga';
import { identifyRaga } from './ragaIdentifier';
import { SWAR_LIST } from '@/lib/noteMapper';

export interface RagaStateCallbacks {
  onStateChange: (state: RagaState) => void;
}

const MAX_RECENT_PHRASES = 10;
const REGION_WINDOW = 8;
const ENERGY_WINDOW_MS = 10000;
const DENSITY_BUFFER_SIZE = 30;

const INITIAL_PULSE: PulseState = {
  detected: false,
  confidence: 0,
  bpm: null,
  medianIOI: null,
  consistency: 0,
};

function octaveOffset(octave: string): number {
  if (octave === 'mandra') return -1;
  if (octave === 'taar') return 1;
  return 0;
}

function octaveScore(octave: string): number {
  if (octave === 'mandra') return 0;
  if (octave === 'taar') return 2;
  return 1;
}

function detectPhase(
  pulseState: PulseState,
  energy: EnergyLevel,
  noteDensity: number
): MusicalPhase {
  if (!pulseState.detected || pulseState.confidence < 0.4) {
    // No pulse — free rhythm
    if (noteDensity < 1.0) return 'alap';
    return 'jod';
  }

  if (pulseState.confidence >= 0.6) {
    return 'gat';
  }

  return 'jod';
}

export function createRagaStateEngine(callbacks: RagaStateCallbacks) {
  const swarUsage = new Map<number, number>();
  let totalNotes = 0;
  let recentPhrases: Phrase[] = [];
  let manualOverride: string | null = null;
  let recentNotes: NoteEvent[] = [];
  let pulseState: PulseState = { ...INITIAL_PULSE };
  let prevEnergy: EnergyLevel = 'low';

  // Circular buffer for note density
  const densityTimestamps: number[] = [];

  function computeNoteDensity(): number {
    if (densityTimestamps.length < 2) return 0;
    const now = densityTimestamps[densityTimestamps.length - 1];
    const cutoff = now - ENERGY_WINDOW_MS;
    const inWindow = densityTimestamps.filter((t) => t > cutoff);
    return inWindow.length / (ENERGY_WINDOW_MS / 1000);
  }

  function getState(): RagaState {
    const completedPhrases = recentPhrases;
    const minDataMet = totalNotes >= 8 && completedPhrases.length >= 1;

    const candidates = minDataMet
      ? identifyRaga({
          swarUsage,
          totalNotes,
          completedPhrases,
          recentPhrases: completedPhrases.slice(-5),
        })
      : [];

    let confirmed: string | null = null;
    if (manualOverride) {
      confirmed = manualOverride;
    } else {
      const top = candidates[0];
      if (top && top.confidence >= 0.75) {
        confirmed = top.name;
      }
    }

    // Count forbidden swar hits
    let forbiddenSwarCount = 0;
    for (const [swarIdx, count] of swarUsage) {
      if (![0, 2, 4, 7, 9].includes(swarIdx)) {
        forbiddenSwarCount += count;
      }
    }

    const energy = computeEnergy();
    const noteDensity = computeNoteDensity();
    const phase = detectPhase(pulseState, energy, noteDensity);

    // Track previous energy for descending detection
    prevEnergy = energy;

    return {
      candidates,
      confirmed,
      region: computeRegion(),
      energy,
      recentPhrases: [...recentPhrases],
      swarUsage: new Map(swarUsage),
      forbiddenSwarCount,
      manualOverride,
      phase,
      tempo: pulseState.bpm,
      pulseConfidence: pulseState.confidence,
      noteDensity,
    };
  }

  function computeRegion(): MelodicRegion {
    const window = recentNotes.slice(-REGION_WINDOW);
    if (window.length === 0) return 'full';

    let poorvangaCount = 0;
    let uttarangaCount = 0;
    for (const note of window) {
      const idx = SWAR_LIST.indexOf(note.swar);
      const pitch = octaveOffset(note.octave) * 12 + idx;
      if (pitch <= 6) poorvangaCount++;
      else uttarangaCount++;
    }

    const total = window.length;
    if (poorvangaCount / total > 0.7) return 'poorvanga';
    if (uttarangaCount / total > 0.7) return 'uttaranga';
    return 'full';
  }

  function computeEnergy(): EnergyLevel {
    const now =
      recentNotes.length > 0
        ? recentNotes[recentNotes.length - 1].timestamp
        : 0;
    const windowNotes = recentNotes.filter(
      (n) => now - n.timestamp < ENERGY_WINDOW_MS
    );

    if (windowNotes.length < 3) return 'low';

    const avgVelocity =
      windowNotes.reduce((s, n) => s + n.velocity, 0) / windowNotes.length;
    const avgOctaveScore =
      windowNotes.reduce((s, n) => s + octaveScore(n.octave), 0) /
      windowNotes.length;
    const timeSpan =
      windowNotes[windowNotes.length - 1].timestamp -
      windowNotes[0].timestamp;
    const density =
      timeSpan > 0 ? (windowNotes.length / timeSpan) * 1000 : 0;

    // Combined score 0-1
    const score =
      (avgVelocity / 127) * 0.4 +
      (avgOctaveScore / 2) * 0.3 +
      Math.min(density / 5, 1) * 0.3;

    // Detect descending: was peak, now dropping
    if (prevEnergy === 'peak' && score < 0.5) return 'descending';

    if (score < 0.25) return 'low';
    if (score < 0.5) return 'building';
    return 'peak';
  }

  function feedNote(event: NoteEvent) {
    const swarIdx = SWAR_LIST.indexOf(event.swar);
    swarUsage.set(swarIdx, (swarUsage.get(swarIdx) ?? 0) + 1);
    totalNotes++;
    recentNotes.push(event);
    if (recentNotes.length > 50) {
      recentNotes = recentNotes.slice(-30);
    }

    // Density tracking
    densityTimestamps.push(event.timestamp);
    if (densityTimestamps.length > DENSITY_BUFFER_SIZE) {
      densityTimestamps.splice(
        0,
        densityTimestamps.length - DENSITY_BUFFER_SIZE
      );
    }

    callbacks.onStateChange(getState());
  }

  function feedPhrase(phrase: Phrase) {
    recentPhrases.push(phrase);
    if (recentPhrases.length > MAX_RECENT_PHRASES) {
      recentPhrases = recentPhrases.slice(-MAX_RECENT_PHRASES);
    }
    callbacks.onStateChange(getState());
  }

  function setPulseState(state: PulseState) {
    pulseState = state;
    callbacks.onStateChange(getState());
  }

  function setManualOverride(ragaName: string | null) {
    manualOverride = ragaName;
    callbacks.onStateChange(getState());
  }

  function reset() {
    swarUsage.clear();
    totalNotes = 0;
    recentPhrases = [];
    recentNotes = [];
    manualOverride = null;
    pulseState = { ...INITIAL_PULSE };
    prevEnergy = 'low';
    densityTimestamps.length = 0;
    callbacks.onStateChange(getState());
  }

  return {
    feedNote,
    feedPhrase,
    setPulseState,
    setManualOverride,
    getState,
    reset,
  };
}
