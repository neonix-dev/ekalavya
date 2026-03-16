'use client';

import { NoteEvent } from '@/types/music';
import { Phrase } from '@/types/raga';

const COMPACT_DISPLAY: Record<string, string> = {
  Sa: 'S', Re_komal: 'r', Re: 'R', Ga_komal: 'g', Ga: 'G',
  Ma: 'M', Ma_tivra: 'M\u2020', Pa: 'P', Dha_komal: 'd',
  Dha: 'D', Ni_komal: 'n', Ni: 'N',
};

function formatNote(event: NoteEvent): string {
  const base = COMPACT_DISPLAY[event.swar] || event.swar;
  if (event.octave === 'mandra') return base + '\u0323'; // dot below
  if (event.octave === 'taar') return base + '\u0307';   // dot above
  return base;
}

interface PhraseGroupProps {
  phrase: Phrase;
  dim?: boolean;
}

function PhraseGroup({ phrase, dim }: PhraseGroupProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-0.5 px-2 py-0.5 rounded
        ${dim ? 'bg-stone-800/20 border border-stone-800/30' : 'bg-stone-800/40 border border-stone-700/40'}
      `}
    >
      {phrase.notes.map((note, i) => {
        const isEmphasis = note.swar === phrase.emphasis;
        const isLanding = i === phrase.notes.length - 1;
        return (
          <span
            key={`${note.midiNote}-${note.timestamp}-${i}`}
            className={`
              font-serif text-base
              ${dim ? 'text-stone-600' : isEmphasis ? 'text-amber-400 font-semibold' : isLanding ? 'text-amber-600/80 underline underline-offset-2 decoration-amber-800/50' : 'text-stone-400'}
            `}
          >
            {formatNote(note)}
          </span>
        );
      })}
    </span>
  );
}

interface PhraseDisplayProps {
  completedPhrases: Phrase[];
  currentPhrase: Phrase | null;
}

export function PhraseDisplay({ completedPhrases, currentPhrase }: PhraseDisplayProps) {
  // Show last 8 completed + current
  const visible = completedPhrases.slice(-8);

  if (visible.length === 0 && !currentPhrase) {
    return (
      <div className="min-h-[2.5rem] flex items-center px-2">
        <span className="text-stone-600 text-sm italic font-serif">play a few notes\u2026</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[2.5rem] px-2">
      {visible.map((phrase, i) => (
        <PhraseGroup key={`${phrase.startTime}-${i}`} phrase={phrase} />
      ))}
      {currentPhrase && currentPhrase.notes.length > 0 && (
        <PhraseGroup phrase={currentPhrase} dim />
      )}
    </div>
  );
}
