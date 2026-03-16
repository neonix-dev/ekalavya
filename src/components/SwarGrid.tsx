'use client';

const SWAR_DISPLAY = ['Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'Ma\u2020', 'Pa', 'dha', 'Dha', 'ni', 'Ni'];

interface SwarGridProps {
  activeSwaras: Set<number>;
  playedSwaras: Map<number, number>;
}

export function SwarGrid({ activeSwaras, playedSwaras }: SwarGridProps) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {SWAR_DISPLAY.map((name, i) => {
        const isActive = activeSwaras.has(i);
        const count = playedSwaras.get(i) || 0;
        const hasBeenPlayed = count > 0;

        return (
          <div
            key={i}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center
              font-serif text-base relative
              border transition-all duration-200
              ${isActive
                ? 'border-amber-700 text-amber-700 bg-amber-900/20 scale-110 shadow-[0_0_20px_rgba(139,94,52,0.15)]'
                : hasBeenPlayed
                  ? 'border-amber-800/50 text-amber-800/70 bg-amber-950/10'
                  : 'border-stone-700 text-stone-600 bg-stone-900/30'
              }
            `}
          >
            {name}
            {hasBeenPlayed && (
              <span className={`
                absolute -bottom-1 -right-0.5 text-[0.55rem] font-mono
                transition-opacity duration-200
                ${isActive ? 'text-amber-600 opacity-100' : 'text-amber-800/50 opacity-80'}
              `}>
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
