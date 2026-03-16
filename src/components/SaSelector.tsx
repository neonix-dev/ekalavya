'use client';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface SaSelectorProps {
  saIndex: number;
  onChange: (index: number) => void;
}

export function SaSelector({ saIndex, onChange }: SaSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <label htmlFor="sa-select" className="text-[0.65rem] tracking-[0.2em] uppercase text-stone-500">
        Sa =
      </label>
      <select
        id="sa-select"
        value={saIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-stone-900 border border-stone-700 text-stone-200 font-mono text-sm px-3 py-1.5 rounded focus:border-amber-700 focus:outline-none"
      >
        {NOTE_NAMES.map((name, i) => (
          <option key={name} value={i}>{name}</option>
        ))}
      </select>
    </div>
  );
}
