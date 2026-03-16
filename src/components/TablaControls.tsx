'use client';

import { PulseState } from '@/types/raga';

interface TablaControlsProps {
  pulseState: PulseState;
  tablaPlaying: boolean;
  currentBeat: number;
  onStartTabla: (bpm: number) => void;
  onStopTabla: () => void;
  tablaVolume: number;
  onTablaVolumeChange: (db: number) => void;
}

export function TablaControls({
  pulseState,
  tablaPlaying,
  currentBeat,
  onStartTabla,
  onStopTabla,
  tablaVolume,
  onTablaVolumeChange,
}: TablaControlsProps) {
  const canStart = pulseState.detected && pulseState.confidence >= 0.6 && pulseState.bpm !== null;

  // Tempo stability: consistency > 0.7 = stable (green), > 0.5 = drifting (yellow), else unstable
  const stabilityColor = pulseState.consistency > 0.7
    ? 'bg-green-500'
    : pulseState.consistency > 0.5
      ? 'bg-yellow-500'
      : 'bg-stone-600';

  return (
    <div className="space-y-3">
      {/* Start/Stop + Tempo */}
      <div className="flex items-center gap-3">
        {tablaPlaying ? (
          <button
            onClick={onStopTabla}
            className="border border-red-800/50 text-red-400/80 px-4 py-1.5 rounded text-[0.6rem] tracking-[0.2em] uppercase hover:border-red-700 hover:text-red-400 transition-colors"
          >
            Stop Tabla
          </button>
        ) : (
          <button
            onClick={() => canStart && pulseState.bpm && onStartTabla(pulseState.bpm)}
            disabled={!canStart}
            className={`
              border px-4 py-1.5 rounded text-[0.6rem] tracking-[0.2em] uppercase transition-colors
              ${canStart
                ? 'border-amber-800/50 text-amber-400/80 hover:border-amber-700 hover:text-amber-400 cursor-pointer'
                : 'border-stone-800/30 text-stone-700 cursor-not-allowed'
              }
            `}
          >
            {canStart
              ? `Start Tabla (\u2669=${pulseState.bpm})`
              : 'No pulse detected'}
          </button>
        )}

        {/* Tempo display with stability dot */}
        {pulseState.bpm && (
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${stabilityColor}`} />
            <span className="text-xs font-mono text-stone-500">
              {pulseState.bpm} BPM
            </span>
          </div>
        )}
      </div>

      {/* Beat indicator — 16 dots grouped 4+4+4+4 */}
      {tablaPlaying && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 16 }, (_, i) => {
            const beatNum = i + 1;
            const isSam = beatNum === 1;
            const isKhali = beatNum === 9;
            const isActive = beatNum === currentBeat;
            const groupGap = i > 0 && i % 4 === 0;

            return (
              <div
                key={i}
                className={`
                  ${groupGap ? 'ml-2' : ''}
                `}
              >
                <div
                  className={`
                    w-3 h-3 rounded-sm flex items-center justify-center text-[0.45rem] font-mono
                    transition-colors duration-75
                    ${isActive
                      ? isSam
                        ? 'bg-amber-500 text-stone-900'
                        : isKhali
                          ? 'bg-stone-400 text-stone-900'
                          : 'bg-amber-700 text-stone-200'
                      : isSam
                        ? 'bg-amber-900/40 text-amber-600/60'
                        : isKhali
                          ? 'bg-stone-700/40 text-stone-500/60'
                          : 'bg-stone-800/40 text-stone-600/40'
                    }
                  `}
                >
                  {isSam ? '\u00D7' : isKhali ? '0' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Volume slider */}
      <div className="flex items-center gap-3">
        <label className="text-[0.6rem] tracking-widest uppercase text-stone-600 w-20">
          Tabla Vol
        </label>
        <input
          type="range"
          min={-30}
          max={6}
          value={tablaVolume}
          onChange={(e) => onTablaVolumeChange(Number(e.target.value))}
          className="flex-1 h-1 accent-amber-700 bg-stone-800 rounded-full appearance-none cursor-pointer"
        />
        <span className="text-xs font-mono text-stone-600 w-10 text-right">
          {tablaVolume}dB
        </span>
      </div>
    </div>
  );
}
