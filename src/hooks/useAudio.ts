import { useState, useEffect, useRef, useCallback } from 'react';
import { Swar, Octave } from '@/types/music';
import { EnergyLevel } from '@/types/raga';
import { createAudioEngine, AudioEngine } from '@/lib/audio/audioEngine';
import { DroneType } from '@/lib/audio/tanpura';

export function useAudio(saBase: number = 61) {
  const [isReady, setIsReady] = useState(false);
  const [tanpuraPlaying, setTanpuraPlaying] = useState(false);
  const [droneType, setDroneTypeState] = useState<DroneType>('Sa-Pa');
  const [noteVolume, setNoteVolumeState] = useState(0);
  const [tanpuraVolume, setTanpuraVolumeState] = useState(-12);

  // Tabla state
  const [tablaPlaying, setTablaPlaying] = useState(false);
  const [tablaBeat, setTablaBeat] = useState(1);
  const [tablaVolume, setTablaVolumeState] = useState(-10);

  const engineRef = useRef<AudioEngine | null>(null);
  const beatPollRef = useRef<number | null>(null);

  useEffect(() => {
    const engine = createAudioEngine(saBase);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
      if (beatPollRef.current !== null) {
        clearInterval(beatPollRef.current);
        beatPollRef.current = null;
      }
    };
    // Only create engine once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Sa base when it changes
  useEffect(() => {
    engineRef.current?.setSaBase(saBase);
  }, [saBase]);

  const resume = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.resume();
      setIsReady(true);
    }
  }, []);

  const noteOn = useCallback((swar: Swar, octave: Octave, velocity: number, midiNote: number) => {
    engineRef.current?.noteOn(swar, octave, velocity, midiNote);
  }, []);

  const noteOff = useCallback((midiNote: number) => {
    engineRef.current?.noteOff(midiNote);
  }, []);

  const startTanpura = useCallback(() => {
    engineRef.current?.startTanpura();
    setTanpuraPlaying(true);
  }, []);

  const stopTanpura = useCallback(() => {
    engineRef.current?.stopTanpura();
    setTanpuraPlaying(false);
  }, []);

  const toggleTanpura = useCallback(() => {
    if (engineRef.current?.isTanpuraPlaying()) {
      stopTanpura();
    } else {
      startTanpura();
    }
  }, [startTanpura, stopTanpura]);

  const setDroneType = useCallback((type: DroneType) => {
    engineRef.current?.setDroneType(type);
    setDroneTypeState(type);
  }, []);

  const setNoteVolume = useCallback((db: number) => {
    engineRef.current?.setNoteVolume(db);
    setNoteVolumeState(db);
  }, []);

  const setTanpuraVolume = useCallback((db: number) => {
    engineRef.current?.setTanpuraVolume(db);
    setTanpuraVolumeState(db);
  }, []);

  const setTanpuraEnergyLevel = useCallback((level: EnergyLevel) => {
    engineRef.current?.setTanpuraEnergyLevel(level);
  }, []);

  // ── Tabla ──

  const startBeatPolling = useCallback(() => {
    if (beatPollRef.current !== null) return;
    beatPollRef.current = window.setInterval(() => {
      if (engineRef.current?.isTablaPlaying()) {
        setTablaBeat(engineRef.current.getTablaCurrentBeat());
      }
    }, 50);
  }, []);

  const stopBeatPolling = useCallback(() => {
    if (beatPollRef.current !== null) {
      clearInterval(beatPollRef.current);
      beatPollRef.current = null;
    }
  }, []);

  const startTabla = useCallback((bpm: number) => {
    engineRef.current?.startTabla(bpm);
    setTablaPlaying(true);
    startBeatPolling();
  }, [startBeatPolling]);

  const stopTabla = useCallback(() => {
    engineRef.current?.stopTabla();
    setTablaPlaying(false);
    setTablaBeat(1);
    stopBeatPolling();
  }, [stopBeatPolling]);

  const setTablaVolume = useCallback((db: number) => {
    engineRef.current?.setTablaVolume(db);
    setTablaVolumeState(db);
  }, []);

  const setTablaTempo = useCallback((bpm: number) => {
    engineRef.current?.setTablaTempo(bpm);
  }, []);

  return {
    isReady,
    resume,
    noteOn,
    noteOff,
    tanpuraPlaying,
    startTanpura,
    stopTanpura,
    toggleTanpura,
    droneType,
    setDroneType,
    noteVolume,
    setNoteVolume,
    tanpuraVolume,
    setTanpuraVolume,
    setTanpuraEnergyLevel,
    // Tabla
    tablaPlaying,
    tablaBeat,
    tablaVolume,
    startTabla,
    stopTabla,
    setTablaVolume,
    setTablaTempo,
  };
}
