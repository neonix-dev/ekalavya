'use client';

import { useState } from 'react';
import { NoteEvent } from '@/types/music';

const SWAR_DISPLAY: Record<string, string> = {
  Sa: 'Sa', Re_komal: 're', Re: 'Re', Ga_komal: 'ga', Ga: 'Ga',
  Ma: 'Ma', Ma_tivra: 'Ma\u2020', Pa: 'Pa', Dha_komal: 'dha',
  Dha: 'Dha', Ni_komal: 'ni', Ni: 'Ni',
};

interface DiagnosticLogProps {
  noteEvents: NoteEvent[];
  onClear: () => void;
}

export function DiagnosticLog({ noteEvents, onClear }: DiagnosticLogProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-stone-800 pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-[0.6rem] tracking-[0.25em] uppercase text-stone-600 hover:text-stone-400 transition-colors flex items-center gap-2"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>&#9654;</span>
        Diagnostic Log
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex justify-end mb-2">
            <button
              onClick={onClear}
              className="text-xs tracking-wider uppercase text-stone-600 border border-stone-700 px-3 py-1 rounded hover:border-stone-500 hover:text-stone-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="border border-stone-800 rounded bg-stone-900/50 max-h-60 overflow-y-auto">
            {noteEvents.length === 0 ? (
              <div className="text-center text-stone-600 text-sm py-6 italic">No events</div>
            ) : (
              <table className="w-full text-sm font-mono">
                <thead className="text-[0.6rem] text-stone-600 uppercase tracking-wider border-b border-stone-800 sticky top-0 bg-stone-900">
                  <tr>
                    <th className="text-left py-1.5 px-3">Swar</th>
                    <th className="text-left py-1.5 px-3">Oct</th>
                    <th className="text-right py-1.5 px-3">Vel</th>
                    <th className="text-right py-1.5 px-3">Dur</th>
                    <th className="text-right py-1.5 px-3 text-stone-700">MIDI</th>
                  </tr>
                </thead>
                <tbody>
                  {noteEvents.map((event, i) => (
                    <tr key={`${event.midiNote}-${event.timestamp}-${i}`} className="border-b border-stone-800/50">
                      <td className="py-1 px-3 text-amber-700">{SWAR_DISPLAY[event.swar]}</td>
                      <td className="py-1 px-3 text-stone-500">{event.octave}</td>
                      <td className="py-1 px-3 text-right text-stone-500">{event.velocity}</td>
                      <td className="py-1 px-3 text-right">
                        {event.duration === null
                          ? <span className="text-emerald-600">held</span>
                          : <span className="text-stone-400">{Math.round(event.duration)}ms</span>
                        }
                      </td>
                      <td className="py-1 px-3 text-right text-stone-700 text-xs">{event.midiNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
