import * as Tone from 'tone';
import { Swar, Octave } from '@/types/music';
import { EnergyLevel } from '@/types/raga';
import { getSaFrequency } from './tuning';
import { createNoteSynth, NoteSynth } from './noteSynth';
import { createTanpura, Tanpura, DroneType } from './tanpura';
import { createTablaEngine, TablaEngine } from './tabla';

export interface AudioEngine {
  resume: () => Promise<void>;
  isReady: () => boolean;

  noteOn: (swar: Swar, octave: Octave, velocity: number, midiNote: number) => void;
  noteOff: (midiNote: number) => void;
  setNoteVolume: (db: number) => void;

  startTanpura: () => void;
  stopTanpura: () => void;
  setDroneType: (type: DroneType) => void;
  setTanpuraVolume: (db: number) => void;
  isTanpuraPlaying: () => boolean;
  setTanpuraEnergyLevel: (level: EnergyLevel) => void;

  startTabla: (bpm: number) => void;
  stopTabla: () => void;
  setTablaTempo: (bpm: number) => void;
  setTablaVolume: (db: number) => void;
  isTablaPlaying: () => boolean;
  getTablaCurrentBeat: () => number;
  getTablaCurrentBpm: () => number;

  setMasterVolume: (db: number) => void;

  dispose: () => void;
  setSaBase: (saBase: number) => void;
}

export function createAudioEngine(initialSaBase: number = 61): AudioEngine {
  let ready = false;
  let saBase = initialSaBase;
  let saFrequency = getSaFrequency(saBase);

  // Raw Web Audio context for note synth (minimal latency)
  let audioCtx: AudioContext | null = null;

  let noteSynth: NoteSynth | null = null;
  let tanpura: Tanpura = createTanpura(saFrequency);
  let tabla: TablaEngine | null = null;

  let noteVolumeDb = 0;
  let tanpuraVolumeDb = -12;
  let tablaVolumeDb = -10;

  async function resume() {
    // Create interactive-latency context for note playback
    audioCtx = new AudioContext({ latencyHint: 'interactive' });

    // Note synth uses raw Web Audio — zero Tone.js overhead
    noteSynth = createNoteSynth(saFrequency, audioCtx);
    noteSynth.setVolume(noteVolumeDb);

    // Start Tone.js for tanpura, minimize its lookAhead
    await Tone.start();
    Tone.getContext().lookAhead = 0.01;

    // Create tabla engine (uses Tone.js)
    tabla = createTablaEngine();
    tabla.setVolume(tablaVolumeDb);

    ready = true;
  }

  function isReady() {
    return ready;
  }

  function noteOn(swar: Swar, octave: Octave, velocity: number, midiNote: number) {
    if (!ready) return;
    noteSynth?.noteOn(swar, octave, velocity, midiNote);
  }

  function noteOff(midiNote: number) {
    if (!ready) return;
    noteSynth?.noteOff(midiNote);
  }

  function setNoteVolume(db: number) {
    noteVolumeDb = db;
    noteSynth?.setVolume(db);
  }

  function startTanpura() {
    if (!ready) return;
    tanpura.start();
  }

  function stopTanpura() {
    tanpura.stop();
  }

  function setDroneType(type: DroneType) {
    tanpura.setDroneType(type);
  }

  function setTanpuraVolume(db: number) {
    tanpuraVolumeDb = db;
    tanpura.setVolume(db);
  }

  function isTanpuraPlaying() {
    return tanpura.isPlaying();
  }

  function setTanpuraEnergyLevel(level: EnergyLevel) {
    tanpura.setEnergyLevel(level);
  }

  // ── Tabla ──

  function startTabla(bpm: number) {
    if (!ready || !tabla) return;
    tabla.start(bpm);
  }

  function stopTabla() {
    tabla?.stop();
  }

  function setTablaTempo(bpm: number) {
    tabla?.setTempo(bpm);
  }

  function setTablaVolume(db: number) {
    tablaVolumeDb = db;
    tabla?.setVolume(db);
  }

  function isTablaPlaying() {
    return tabla?.isPlaying() ?? false;
  }

  function getTablaCurrentBeat() {
    return tabla?.getCurrentBeat() ?? 1;
  }

  function getTablaCurrentBpm() {
    return tabla?.getCurrentBpm() ?? 0;
  }

  function setMasterVolume(db: number) {
    Tone.getDestination().volume.value = db;
  }

  function dispose() {
    noteSynth?.dispose();
    tanpura.dispose();
    tabla?.dispose();
    tabla = null;
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close();
    }
  }

  function setSaBase(newSaBase: number) {
    if (newSaBase === saBase) return;
    const wasTanpuraPlaying = tanpura.isPlaying();
    const wasTablaPlaying = tabla?.isPlaying() ?? false;
    const tablaBpm = tabla?.getCurrentBpm() ?? 0;

    saBase = newSaBase;
    saFrequency = getSaFrequency(saBase);

    noteSynth?.dispose();
    tanpura.dispose();

    if (audioCtx) {
      noteSynth = createNoteSynth(saFrequency, audioCtx);
      noteSynth.setVolume(noteVolumeDb);
    }

    tanpura = createTanpura(saFrequency);
    tanpura.setVolume(tanpuraVolumeDb);

    if (wasTanpuraPlaying) {
      tanpura.start();
    }

    // Tabla doesn't depend on Sa frequency — no need to recreate
    // But if it was playing, keep it going
    if (wasTablaPlaying && tabla) {
      // Already running, no action needed
    }
  }

  return {
    resume,
    isReady,
    noteOn,
    noteOff,
    setNoteVolume,
    startTanpura,
    stopTanpura,
    setDroneType,
    setTanpuraVolume,
    isTanpuraPlaying,
    setTanpuraEnergyLevel,
    startTabla,
    stopTabla,
    setTablaTempo,
    setTablaVolume,
    isTablaPlaying,
    getTablaCurrentBeat,
    getTablaCurrentBpm,
    setMasterVolume,
    dispose,
    setSaBase,
  };
}
