'use client';

import { EnergyLevel } from '@/types/raga';

interface EnergyArcProps {
  energy: EnergyLevel;
}

const ENERGY_CONFIG: Record<EnergyLevel, { width: string; color: string; pulse: boolean }> = {
  low:        { width: '25%',  color: 'bg-stone-600',   pulse: false },
  building:   { width: '50%',  color: 'bg-amber-700/70', pulse: false },
  peak:       { width: '100%', color: 'bg-amber-500',   pulse: true },
  descending: { width: '50%',  color: 'bg-amber-800/60', pulse: false },
};

export function EnergyArc({ energy }: EnergyArcProps) {
  const config = ENERGY_CONFIG[energy];

  return (
    <div className="w-full h-1 bg-stone-800/50 rounded-full overflow-hidden">
      <div
        className={`
          h-full rounded-full transition-all duration-1000 ease-in-out
          ${config.color}
          ${config.pulse ? 'animate-pulse' : ''}
        `}
        style={{ width: config.width }}
      />
    </div>
  );
}
