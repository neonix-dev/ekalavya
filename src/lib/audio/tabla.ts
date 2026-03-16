import * as Tone from 'tone';

export type TablaStroke = 'Dha' | 'Dhin' | 'Tin' | 'Ta' | 'Na';

// The 16-beat Teentaal theka
export const TEENTAAL_THEKA: TablaStroke[] = [
  'Dha', 'Dhin', 'Dhin', 'Dha',  // beats 1-4 (Sam section)
  'Dha', 'Dhin', 'Dhin', 'Dha',  // beats 5-8
  'Dha', 'Tin',  'Tin',  'Ta',   // beats 9-12 (Khali section)
  'Ta',  'Dhin', 'Dhin', 'Dha',  // beats 13-16
];

// Stroke synthesis parameters
const STROKE_PARAMS: Record<
  TablaStroke,
  {
    trebleFreq: number;
    trebleDecay: number;
    hasBass: boolean;
    noiseDecay: number;
  }
> = {
  Dha:  { trebleFreq: 350, trebleDecay: 0.15, hasBass: true,  noiseDecay: 0.008 },
  Dhin: { trebleFreq: 450, trebleDecay: 0.20, hasBass: true,  noiseDecay: 0.010 },
  Tin:  { trebleFreq: 450, trebleDecay: 0.10, hasBass: false, noiseDecay: 0.006 },
  Ta:   { trebleFreq: 350, trebleDecay: 0.08, hasBass: false, noiseDecay: 0.005 },
  Na:   { trebleFreq: 550, trebleDecay: 0.06, hasBass: false, noiseDecay: 0.004 },
};

export interface TablaEngine {
  start: (bpm: number) => void;
  stop: () => void;
  setTempo: (bpm: number) => void;
  setVolume: (db: number) => void;
  isPlaying: () => boolean;
  getCurrentBeat: () => number;
  getCurrentBpm: () => number;
  dispose: () => void;
}

export function createTablaEngine(): TablaEngine {
  let playing = false;
  let currentBeat = 1; // 1-16
  let currentBpm = 0;

  const volume = new Tone.Volume(-10).toDestination();

  // ── Bass voices (bayan) — 2 alternating ──
  const bassPool: Tone.Synth[] = [];
  for (let i = 0; i < 2; i++) {
    bassPool.push(
      new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.005,
          decay: 0.2,
          sustain: 0,
          release: 0.1,
        },
      }).connect(volume)
    );
  }
  let bassIdx = 0;

  // ── Treble voices (dayan) — 2 alternating ──
  const treblePool: Tone.Synth[] = [];
  for (let i = 0; i < 2; i++) {
    treblePool.push(
      new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.002,
          decay: 0.15, // overridden per stroke
          sustain: 0,
          release: 0.05,
        },
      }).connect(volume)
    );
  }
  let trebleIdx = 0;

  // ── Noise burst for attack transient ──
  const noiseSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.001,
      decay: 0.008,
      sustain: 0,
      release: 0.001,
    },
  });
  const noiseFilter = new Tone.Filter({
    frequency: 3000,
    type: 'bandpass',
    Q: 2,
  }).connect(volume);
  noiseSynth.connect(noiseFilter);

  let sequence: Tone.Sequence | null = null;

  function triggerStroke(stroke: TablaStroke, time: number) {
    const params = STROKE_PARAMS[stroke];

    // Treble (dayan)
    const treble = treblePool[trebleIdx % 2];
    trebleIdx++;
    treble.envelope.decay = params.trebleDecay;
    treble.triggerAttackRelease(params.trebleFreq, params.trebleDecay + 0.05, time, 0.7);

    // Noise transient
    noiseSynth.envelope.decay = params.noiseDecay;
    noiseSynth.triggerAttackRelease(params.noiseDecay + 0.002, time);

    // Bass (bayan) for Dha/Dhin
    if (params.hasBass) {
      const bass = bassPool[bassIdx % 2];
      bassIdx++;
      // Pitch bend: 90Hz → 70Hz during decay
      bass.frequency.setValueAtTime(90, time);
      bass.frequency.linearRampToValueAtTime(70, time + 0.2);
      bass.triggerAttackRelease(90, 0.25, time, 0.6);
    }
  }

  function start(bpm: number) {
    if (playing) return;
    playing = true;
    currentBpm = bpm;
    currentBeat = 1;

    // Set transport BPM — this affects Sequence timing
    Tone.getTransport().bpm.value = bpm;

    // Ensure transport is running (tanpura may already have started it)
    if (Tone.getTransport().state !== 'started') {
      Tone.getTransport().start();
    }

    // Create a 16-step sequence, each step = one beat
    // Subdivision "4n" means each step is a quarter note
    sequence = new Tone.Sequence(
      (time, stepIdx) => {
        const stroke = TEENTAAL_THEKA[stepIdx];
        currentBeat = stepIdx + 1;
        triggerStroke(stroke, time);
      },
      Array.from({ length: 16 }, (_, i) => i),
      '4n'
    );

    sequence.loop = true;
    sequence.start(Tone.now());
  }

  function stop() {
    if (!playing) return;
    playing = false;
    currentBeat = 1;

    if (sequence) {
      sequence.stop();
      sequence.dispose();
      sequence = null;
    }
  }

  function setTempo(bpm: number) {
    if (bpm === currentBpm) return;
    currentBpm = bpm;
    Tone.getTransport().bpm.rampTo(bpm, 1);
  }

  function setVolume(db: number) {
    volume.volume.value = db;
  }

  function dispose() {
    stop();
    for (const s of bassPool) s.dispose();
    for (const s of treblePool) s.dispose();
    noiseSynth.dispose();
    noiseFilter.dispose();
    volume.dispose();
    bassPool.length = 0;
    treblePool.length = 0;
  }

  return {
    start,
    stop,
    setTempo,
    setVolume,
    isPlaying: () => playing,
    getCurrentBeat: () => currentBeat,
    getCurrentBpm: () => currentBpm,
    dispose,
  };
}
