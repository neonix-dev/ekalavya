'use client';

import { MusicalPhase } from '@/types/raga';

interface PhaseIndicatorProps {
  phase: MusicalPhase;
}

const PHASES: { key: MusicalPhase; label: string }[] = [
  { key: 'alap', label: 'Alap' },
  { key: 'jod', label: 'Jod' },
  { key: 'gat', label: 'Gat' },
];

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {PHASES.map(({ key, label }) => (
        <span
          key={key}
          className={`
            text-[0.6rem] tracking-[0.25em] uppercase font-mono
            ${phase === key
              ? 'text-amber-400'
              : 'text-stone-700'
            }
            transition-colors duration-500
          `}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
