'use client';

import { NoteEvent } from '@/types/music';

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

interface NoteStreamProps {
  recentNotes: NoteEvent[];
}

export function NoteStream({ recentNotes }: NoteStreamProps) {
  const display = recentNotes.slice(0, 30);

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[2.5rem] px-2">
      {display.length === 0 ? (
        <span className="text-stone-600 text-sm italic font-serif">play a few notes\u2026</span>
      ) : (
        display.map((note, i) => (
          <span
            key={`${note.midiNote}-${note.timestamp}-${i}`}
            className={`
              font-serif text-lg
              ${i === 0 ? 'text-amber-500' : i < 5 ? 'text-amber-700/80' : 'text-stone-500'}
              ${note.duration === null ? 'animate-pulse' : ''}
            `}
          >
            {formatNote(note)}
          </span>
        ))
      )}
    </div>
  );
}
