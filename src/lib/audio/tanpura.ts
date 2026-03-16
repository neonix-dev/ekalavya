import * as Tone from 'tone';
import { getFrequency } from './tuning';
import { EnergyLevel } from '@/types/raga';

export type DroneType = 'Sa-Pa' | 'Sa-Ma';

const ENERGY_OFFSETS: Record<EnergyLevel, number> = {
  low: 0,
  building: -1.5,
  peak: -3,
  descending: -1,
};

export interface Tanpura {
  start: () => void;
  stop: () => void;
  setDroneType: (type: DroneType) => void;
  setVolume: (db: number) => void;
  setEnergyLevel: (level: EnergyLevel) => void;
  isPlaying: () => boolean;
  dispose: () => void;
}

export function createTanpura(saFrequency: number, initialDroneType: DroneType = 'Sa-Pa'): Tanpura {
  let droneType = initialDroneType;
  let playing = false;
  let loopEvent: Tone.Loop | null = null;
  let stringIndex = 0;

  const volume = new Tone.Volume(-12).toDestination();

  // Create a synth pool for overlapping pluck sounds
  // Using FMSynth for richer harmonics reminiscent of tanpura strings
  function createPluckSynth(): Tone.Synth {
    return new Tone.Synth({
      oscillator: {
        type: 'fatsine',
        count: 3,
        spread: 10,
      },
      envelope: {
        attack: 0.005,
        decay: 2.5,
        sustain: 0,
        release: 0.5,
      },
    }).connect(volume);
  }

  // Pool of synths for overlapping plucks
  const synthPool: Tone.Synth[] = [];
  const POOL_SIZE = 6;
  for (let i = 0; i < POOL_SIZE; i++) {
    synthPool.push(createPluckSynth());
  }
  let poolIndex = 0;

  function getStringFrequencies(): number[] {
    const saMandra = getFrequency('Sa', 'mandra', saFrequency);
    const saTaar = getFrequency('Sa', 'taar', saFrequency);

    const string1Freq = droneType === 'Sa-Pa'
      ? getFrequency('Pa', 'madhya', saFrequency)
      : getFrequency('Ma', 'madhya', saFrequency);

    // Pa/Ma, Sa(taar), Sa(taar), Sa(mandra)
    return [string1Freq, saTaar, saTaar, saMandra];
  }

  function pluckString() {
    const freqs = getStringFrequencies();
    const freq = freqs[stringIndex % 4];

    // Slight random detuning for organic feel (±3 cents)
    const detuneCents = (Math.random() - 0.5) * 6;
    const detunedFreq = freq * Math.pow(2, detuneCents / 1200);

    const synth = synthPool[poolIndex % POOL_SIZE];
    poolIndex++;

    synth.triggerAttackRelease(detunedFreq, '3n', Tone.now(), 0.6 + Math.random() * 0.15);
    stringIndex++;
  }

  function start() {
    if (playing) return;
    playing = true;
    stringIndex = 0;

    // Ensure transport is running
    if (Tone.getTransport().state !== 'started') {
      Tone.getTransport().start();
    }

    // Pluck immediately, then cycle every ~0.8s
    pluckString();
    loopEvent = new Tone.Loop(() => {
      pluckString();
    }, 0.8);
    loopEvent.start(Tone.now());
  }

  function stop() {
    if (!playing) return;
    playing = false;
    if (loopEvent) {
      loopEvent.stop();
      loopEvent.dispose();
      loopEvent = null;
    }
    stringIndex = 0;
  }

  function setDroneType(type: DroneType) {
    droneType = type;
    // If playing, restart to pick up new frequencies
    if (playing) {
      stop();
      start();
    }
  }

  let baseVolume = -12;
  let currentEnergyOffset = 0;

  function setVolume(db: number) {
    baseVolume = db;
    volume.volume.value = baseVolume + currentEnergyOffset;
  }

  function setEnergyLevel(level: EnergyLevel) {
    const targetOffset = ENERGY_OFFSETS[level];
    if (targetOffset === currentEnergyOffset) return;
    currentEnergyOffset = targetOffset;
    const target = baseVolume + currentEnergyOffset;
    volume.volume.rampTo(target, 2);
  }

  function dispose() {
    stop();
    for (const s of synthPool) {
      s.dispose();
    }
    synthPool.length = 0;
    volume.dispose();
  }

  return {
    start,
    stop,
    setDroneType,
    setVolume,
    setEnergyLevel,
    isPlaying: () => playing,
    dispose,
  };
}
