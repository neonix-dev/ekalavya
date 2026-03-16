'use client';

import { DroneType } from '@/lib/audio/tanpura';

interface TanpuraControlsProps {
  isReady: boolean;
  playing: boolean;
  droneType: DroneType;
  volume: number;
  onToggle: () => void;
  onDroneTypeChange: (type: DroneType) => void;
  onVolumeChange: (db: number) => void;
}

export function TanpuraControls({
  isReady,
  playing,
  droneType,
  volume,
  onToggle,
  onDroneTypeChange,
  onVolumeChange,
}: TanpuraControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {/* On/Off toggle */}
        <button
          onClick={onToggle}
          disabled={!isReady}
          className={`
            px-5 py-2 rounded font-mono text-xs tracking-widest uppercase
            border transition-all duration-300
            ${!isReady
              ? 'border-stone-800 text-stone-700 cursor-not-allowed'
              : playing
                ? 'border-amber-700 text-amber-600 bg-amber-950/30 shadow-[0_0_12px_rgba(139,94,52,0.1)]'
                : 'border-stone-700 text-stone-400 hover:border-stone-500'
            }
          `}
        >
          {playing ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              Tanpura On
            </span>
          ) : (
            'Tanpura'
          )}
        </button>

        {/* Drone type selector */}
        <div className="flex gap-1">
          {(['Sa-Pa', 'Sa-Ma'] as DroneType[]).map((type) => (
            <button
              key={type}
              onClick={() => onDroneTypeChange(type)}
              disabled={!isReady}
              className={`
                px-3 py-1.5 rounded text-xs font-mono tracking-wider
                border transition-colors
                ${droneType === type
                  ? 'border-amber-800 text-amber-600 bg-amber-950/20'
                  : 'border-stone-800 text-stone-500 hover:border-stone-600'
                }
                ${!isReady ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-3">
        <label className="text-[0.6rem] tracking-widest uppercase text-stone-600 w-20">
          Drone Vol
        </label>
        <input
          type="range"
          min={-30}
          max={0}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          disabled={!isReady}
          className="flex-1 h-1 accent-amber-700 bg-stone-800 rounded-full appearance-none cursor-pointer disabled:opacity-50"
        />
        <span className="text-xs font-mono text-stone-600 w-10 text-right">{volume}dB</span>
      </div>
    </div>
  );
}
