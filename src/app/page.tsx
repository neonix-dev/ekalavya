'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { NoteEvent } from '@/types/music';
import { useMidi } from '@/hooks/useMidi';
import { useAudio } from '@/hooks/useAudio';
import { useRaga } from '@/hooks/useRaga';
import { SWAR_LIST } from '@/lib/noteMapper';
import { SwarGrid } from '@/components/SwarGrid';
import { NoteStream } from '@/components/NoteStream';
import { PhraseDisplay } from '@/components/PhraseDisplay';
import { RagaDisplay } from '@/components/RagaDisplay';
import { TanpuraControls } from '@/components/TanpuraControls';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { SaSelector } from '@/components/SaSelector';
import { DiagnosticLog } from '@/components/DiagnosticLog';
import { PhaseIndicator } from '@/components/PhaseIndicator';
import { EnergyArc } from '@/components/EnergyArc';
import { TablaControls } from '@/components/TablaControls';

function noteNameToMidi(index: number): number {
  return 60 + index;
}

export default function Home() {
  const [saIndex, setSaIndex] = useState(1); // C# = index 1
  const saBase = noteNameToMidi(saIndex);

  const audio = useAudio(saBase);
  const raga = useRaga();

  // Track swar activity for the grid
  const [activeSwaras, setActiveSwaras] = useState<Set<number>>(new Set());
  const [playedSwaras, setPlayedSwaras] = useState<Map<number, number>>(new Map());

  // Track total notes for raga display
  const [totalNotes, setTotalNotes] = useState(0);

  const onNoteStart = useCallback((event: NoteEvent) => {
    const swarIndex = SWAR_LIST.indexOf(event.swar);
    audio.noteOn(event.swar, event.octave, event.velocity, event.midiNote);
    raga.feedNote(event);

    setTotalNotes((n) => n + 1);
    setActiveSwaras((prev) => {
      const next = new Set(prev);
      next.add(swarIndex);
      return next;
    });
    setPlayedSwaras((prev) => {
      const next = new Map(prev);
      next.set(swarIndex, (next.get(swarIndex) || 0) + 1);
      return next;
    });
  }, [audio, raga]);

  const onNoteEnd = useCallback((event: NoteEvent) => {
    const swarIndex = SWAR_LIST.indexOf(event.swar);
    audio.noteOff(event.midiNote);

    if (event.duration != null) {
      raga.updateNoteDuration(event.midiNote, event.duration);
    }

    setActiveSwaras((prev) => {
      const next = new Set(prev);
      next.delete(swarIndex);
      return next;
    });
  }, [audio, raga]);

  const midiCallbacks = useMemo(() => ({ onNoteStart, onNoteEnd }), [onNoteStart, onNoteEnd]);
  const midi = useMidi(saBase, midiCallbacks);

  // Note volume slider
  const [noteVolume, setNoteVolume] = useState(0);
  const handleNoteVolumeChange = useCallback((db: number) => {
    setNoteVolume(db);
    audio.setNoteVolume(db);
  }, [audio]);

  // Phrase config tuning
  const [showPhraseConfig, setShowPhraseConfig] = useState(false);

  const handleRagaReset = useCallback(() => {
    raga.reset();
    setTotalNotes(0);
  }, [raga]);

  // ── Tanpura energy adaptation ──
  useEffect(() => {
    audio.setTanpuraEnergyLevel(raga.ragaState.energy);
  }, [raga.ragaState.energy, audio]);

  // ── Tabla tempo sync ──
  const prevBpmRef = useRef<number | null>(null);
  useEffect(() => {
    if (!audio.tablaPlaying || !raga.pulseState.bpm) return;

    const newBpm = raga.pulseState.bpm;
    const prevBpm = prevBpmRef.current;

    if (prevBpm !== null) {
      const drift = Math.abs(newBpm - prevBpm) / prevBpm;
      // Only follow gradual drift (< 15%), ignore sudden jumps
      if (drift < 0.15) {
        audio.setTablaTempo(newBpm);
      }
    }
    prevBpmRef.current = newBpm;
  }, [raga.pulseState.bpm, audio.tablaPlaying, audio]);

  // ── Tabla auto-stop when pulse lost for 8+ seconds ──
  const pulseLostTimestampRef = useRef<number | null>(null);
  const autoStopIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audio.tablaPlaying) {
      pulseLostTimestampRef.current = null;
      if (autoStopIntervalRef.current !== null) {
        clearInterval(autoStopIntervalRef.current);
        autoStopIntervalRef.current = null;
      }
      return;
    }

    if (raga.pulseState.confidence < 0.3) {
      if (pulseLostTimestampRef.current === null) {
        pulseLostTimestampRef.current = Date.now();
      }
      // Start checking periodically
      if (autoStopIntervalRef.current === null) {
        autoStopIntervalRef.current = window.setInterval(() => {
          if (
            pulseLostTimestampRef.current !== null &&
            Date.now() - pulseLostTimestampRef.current > 8000
          ) {
            audio.stopTabla();
            pulseLostTimestampRef.current = null;
            if (autoStopIntervalRef.current !== null) {
              clearInterval(autoStopIntervalRef.current);
              autoStopIntervalRef.current = null;
            }
          }
        }, 1000);
      }
    } else {
      // Pulse recovered
      pulseLostTimestampRef.current = null;
      if (autoStopIntervalRef.current !== null) {
        clearInterval(autoStopIntervalRef.current);
        autoStopIntervalRef.current = null;
      }
    }
  }, [raga.pulseState.confidence, audio.tablaPlaying, audio]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (autoStopIntervalRef.current !== null) {
        clearInterval(autoStopIntervalRef.current);
      }
    };
  }, []);

  const handleStartTabla = useCallback((bpm: number) => {
    audio.startTabla(bpm);
  }, [audio]);

  const handleStopTabla = useCallback(() => {
    audio.stopTabla();
    prevBpmRef.current = null;
  }, [audio]);

  return (
    <>
      {/* Audio start overlay */}
      {!audio.isReady && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1814]/95 cursor-pointer"
          onClick={audio.resume}
        >
          <h1 className="font-serif text-5xl font-light tracking-[0.15em] text-amber-200/80 mb-4">
            Ekalavya
          </h1>
          <p className="text-stone-500 text-xs tracking-[0.3em] uppercase mb-10">
            the silent mirror for your riyaz
          </p>
          <button className="border border-stone-600 text-stone-400 px-8 py-3 rounded font-mono text-xs tracking-[0.3em] uppercase hover:border-amber-700 hover:text-amber-600 transition-colors">
            Begin
          </button>
          <p className="text-stone-700 text-[0.6rem] tracking-widest mt-6 uppercase">
            click anywhere to start audio
          </p>
        </div>
      )}

      <div className="min-h-screen bg-[#1a1814] text-stone-200 font-mono">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <header className="text-center mb-6">
            <h1 className="font-serif text-4xl font-light tracking-[0.15em] text-amber-200/80 mb-1">
              Ekalavya
            </h1>
            <p className="text-[0.65rem] tracking-[0.3em] uppercase text-stone-500">
              the silent mirror for your riyaz
            </p>
          </header>

          {/* Connection status */}
          <div className="mb-4">
            <ConnectionStatus status={midi.connectionStatus} deviceInfo={midi.deviceInfo} />
          </div>

          {/* Sa selector */}
          <div className="mb-8">
            <SaSelector saIndex={saIndex} onChange={setSaIndex} />
          </div>

          {/* Swar Grid */}
          <section className="mb-8">
            <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-6 flex flex-col items-center">
              <SwarGrid activeSwaras={activeSwaras} playedSwaras={playedSwaras} />
            </div>
          </section>

          {/* Raga Identification */}
          <section className="mb-8">
            <h2 className="text-[0.6rem] tracking-[0.25em] uppercase text-stone-600 mb-2">Raga</h2>
            <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5">
              <RagaDisplay
                ragaState={raga.ragaState}
                totalNotes={totalNotes}
                onManualOverride={raga.setManualOverride}
                onReset={handleRagaReset}
              />
            </div>
          </section>

          {/* Phase & Energy */}
          <section className="mb-8">
            <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <PhaseIndicator phase={raga.ragaState.phase} />
                <span className="text-[0.55rem] font-mono text-stone-600">
                  {raga.ragaState.noteDensity.toFixed(1)} n/s
                </span>
              </div>
              <EnergyArc energy={raga.ragaState.energy} />
            </div>
          </section>

          {/* Phrase Display */}
          <section className="mb-8">
            <h2 className="text-[0.6rem] tracking-[0.25em] uppercase text-stone-600 mb-2">Phrases</h2>
            <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-4">
              <PhraseDisplay
                completedPhrases={raga.completedPhrases}
                currentPhrase={raga.currentPhrase}
              />
            </div>
          </section>

          {/* Note Stream (Layer 1) */}
          <section className="mb-8">
            <h2 className="text-[0.6rem] tracking-[0.25em] uppercase text-stone-600 mb-2">Note Stream</h2>
            <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-4">
              <NoteStream recentNotes={midi.noteEvents} />
            </div>
          </section>

          {/* Tanpura Controls */}
          <section className="mb-8">
            <h2 className="text-[0.6rem] tracking-[0.25em] uppercase text-stone-600 mb-3">Tanpura</h2>
            <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5">
              <TanpuraControls
                isReady={audio.isReady}
                playing={audio.tanpuraPlaying}
                droneType={audio.droneType}
                volume={audio.tanpuraVolume}
                onToggle={audio.toggleTanpura}
                onDroneTypeChange={audio.setDroneType}
                onVolumeChange={audio.setTanpuraVolume}
              />
              {/* Note volume */}
              <div className="flex items-center gap-3 mt-3">
                <label className="text-[0.6rem] tracking-widest uppercase text-stone-600 w-20">
                  Note Vol
                </label>
                <input
                  type="range"
                  min={-30}
                  max={6}
                  value={noteVolume}
                  onChange={(e) => handleNoteVolumeChange(Number(e.target.value))}
                  disabled={!audio.isReady}
                  className="flex-1 h-1 accent-amber-700 bg-stone-800 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                />
                <span className="text-xs font-mono text-stone-600 w-10 text-right">{noteVolume}dB</span>
              </div>
            </div>
          </section>

          {/* Tabla Controls */}
          <section className="mb-8">
            <h2 className="text-[0.6rem] tracking-[0.25em] uppercase text-stone-600 mb-3">Tabla</h2>
            <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5">
              <TablaControls
                pulseState={raga.pulseState}
                tablaPlaying={audio.tablaPlaying}
                currentBeat={audio.tablaBeat}
                onStartTabla={handleStartTabla}
                onStopTabla={handleStopTabla}
                tablaVolume={audio.tablaVolume}
                onTablaVolumeChange={audio.setTablaVolume}
              />
            </div>
          </section>

          {/* Phrase Config Tuning */}
          <section className="mb-8">
            <button
              onClick={() => setShowPhraseConfig((p) => !p)}
              className="text-[0.6rem] tracking-[0.25em] uppercase text-stone-600 hover:text-stone-400 transition-colors mb-2"
            >
              {showPhraseConfig ? '\u25BE Phrase Config' : '\u25B8 Phrase Config'}
            </button>
            {showPhraseConfig && (
              <div className="bg-stone-900/30 border border-stone-800/50 rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-[0.6rem] tracking-widest uppercase text-stone-600 w-28">
                    Silence Gap
                  </label>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    value={raga.phraseConfig.silenceGapMs}
                    onChange={(e) => raga.setPhraseConfig({ silenceGapMs: Number(e.target.value) })}
                    className="flex-1 h-1 accent-amber-700 bg-stone-800 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono text-stone-600 w-14 text-right">
                    {raga.phraseConfig.silenceGapMs}ms
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[0.6rem] tracking-widest uppercase text-stone-600 w-28">
                    Hold Mult.
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    step={1}
                    value={Math.round(raga.phraseConfig.holdMultiplier * 10)}
                    onChange={(e) => raga.setPhraseConfig({ holdMultiplier: Number(e.target.value) / 10 })}
                    className="flex-1 h-1 accent-amber-700 bg-stone-800 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono text-stone-600 w-14 text-right">
                    {raga.phraseConfig.holdMultiplier.toFixed(1)}x
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[0.6rem] tracking-widest uppercase text-stone-600 w-28">
                    Vel. Drop
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={Math.round(raga.phraseConfig.velocityDropRatio * 100)}
                    onChange={(e) => raga.setPhraseConfig({ velocityDropRatio: Number(e.target.value) / 100 })}
                    className="flex-1 h-1 accent-amber-700 bg-stone-800 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono text-stone-600 w-14 text-right">
                    {Math.round(raga.phraseConfig.velocityDropRatio * 100)}%
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Diagnostic Log */}
          <section className="mb-8">
            <DiagnosticLog noteEvents={midi.noteEvents} onClear={midi.clearEvents} />
          </section>
        </div>
      </div>
    </>
  );
}
