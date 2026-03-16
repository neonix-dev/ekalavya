'use client';

import { useState } from 'react';
import { RagaState } from '@/types/raga';
import { getRagaByName } from '@/lib/raga/ragaDatabase';

interface RagaDisplayProps {
  ragaState: RagaState;
  totalNotes: number;
  onManualOverride: (ragaName: string | null) => void;
  onReset: () => void;
}

export function RagaDisplay({ ragaState, totalNotes, onManualOverride, onReset }: RagaDisplayProps) {
  const [showReasons, setShowReasons] = useState(false);
  const { candidates, confirmed, manualOverride, recentPhrases } = ragaState;

  const isListening = totalNotes < 8 || recentPhrases.length < 1;

  const ragaDef = confirmed ? getRagaByName(confirmed) : null;

  return (
    <div>
      {/* Main identification */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isListening ? (
            <div>
              <p className="font-serif text-xl italic text-stone-500">Listening\u2026</p>
              <p className="text-[0.6rem] text-stone-600 mt-1 tracking-wider">
                {totalNotes < 8
                  ? `${totalNotes}/8 notes`
                  : 'waiting for phrases\u2026'}
              </p>
            </div>
          ) : confirmed ? (
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-3xl font-light text-amber-200/90 tracking-wide">
                  {confirmed}
                </h3>
                {manualOverride && (
                  <span className="text-[0.55rem] tracking-widest uppercase bg-stone-700/50 text-stone-400 px-2 py-0.5 rounded">
                    manual
                  </span>
                )}
              </div>
              {ragaDef && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-stone-500">
                    <span className="text-stone-600">Aroh:</span>{' '}
                    <span className="font-serif italic">{ragaDef.aroh.join(' ')}</span>
                  </p>
                  <p className="text-xs text-stone-500">
                    <span className="text-stone-600">Avroh:</span>{' '}
                    <span className="font-serif italic">{ragaDef.avroh.join(' ')}</span>
                  </p>
                  <p className="text-[0.6rem] text-stone-600 tracking-wider">
                    Thaat: {ragaDef.thaat} &middot; Vadi: {ragaDef.vadi} &middot; Samvadi: {ragaDef.samvadi}
                  </p>
                </div>
              )}
            </div>
          ) : candidates.length > 0 ? (
            <div>
              <p className="text-xs text-stone-500 tracking-wider mb-2">Candidates</p>
              <div className="space-y-1.5">
                {candidates.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="font-serif text-lg text-amber-300/70">{c.name}</span>
                    <div className="flex-1 h-1 bg-stone-800 rounded-full overflow-hidden max-w-32">
                      <div
                        className="h-full bg-amber-700/60 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(c.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-[0.6rem] text-stone-600 font-mono w-8">
                      {Math.round(c.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="font-serif text-xl italic text-stone-500">Listening\u2026</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {!isListening && candidates.length > 0 && (
            <button
              onClick={() => setShowReasons((p) => !p)}
              className="text-[0.55rem] tracking-widest uppercase text-stone-600 hover:text-stone-400 transition-colors"
            >
              {showReasons ? 'hide' : 'why?'}
            </button>
          )}
          <button
            onClick={onReset}
            className="text-[0.55rem] tracking-widest uppercase text-stone-600 hover:text-stone-400 transition-colors"
          >
            reset
          </button>
        </div>
      </div>

      {/* Reasons */}
      {showReasons && candidates.length > 0 && (
        <div className="mt-3 p-3 bg-stone-800/30 rounded border border-stone-800/50">
          {candidates.map((c) => (
            <div key={c.name} className="mb-2 last:mb-0">
              <p className="text-[0.6rem] text-stone-500 tracking-wider mb-1">{c.name}</p>
              <ul className="space-y-0.5">
                {c.reasons.map((r, i) => (
                  <li
                    key={i}
                    className={`text-[0.6rem] ${r.startsWith('Warning') ? 'text-red-400/70' : 'text-stone-500'}`}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Manual override */}
      <div className="mt-3 flex items-center gap-2">
        <label className="text-[0.55rem] tracking-widest uppercase text-stone-600">Override:</label>
        <select
          value={manualOverride ?? ''}
          onChange={(e) => onManualOverride(e.target.value || null)}
          className="bg-stone-900/50 border border-stone-800/50 rounded text-xs text-stone-400 px-2 py-1 font-mono"
        >
          <option value="">Auto-detect</option>
          <option value="Bhoop">Bhoop</option>
        </select>
      </div>
    </div>
  );
}
