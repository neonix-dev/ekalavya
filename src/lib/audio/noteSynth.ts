import { Swar, Octave } from '@/types/music';
import { getFrequency } from './tuning';

export interface NoteSynth {
  noteOn: (swar: Swar, octave: Octave, velocity: number, midiNote: number) => void;
  noteOff: (midiNote: number) => void;
  setVolume: (db: number) => void;
  dispose: () => void;
}

interface ActiveVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

export function createNoteSynth(saFrequency: number, ctx?: AudioContext): NoteSynth {
  // Use provided context or fall back to a new one
  const audioCtx = ctx || new AudioContext({ latencyHint: 'interactive' });

  // Master volume node
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(audioCtx.destination);

  const activeVoices = new Map<number, ActiveVoice>();

  const ATTACK = 0.01;
  const RELEASE = 0.3;

  function noteOn(swar: Swar, octave: Octave, velocity: number, midiNote: number) {
    const freq = getFrequency(swar, octave, saFrequency);

    // Kill existing voice on same key
    const existing = activeVoices.get(midiNote);
    if (existing) {
      const now = audioCtx.currentTime;
      existing.gain.gain.cancelScheduledValues(now);
      existing.gain.gain.setValueAtTime(existing.gain.gain.value, now);
      existing.gain.gain.linearRampToValueAtTime(0, now + 0.005);
      existing.oscillator.stop(now + 0.01);
      activeVoices.delete(midiNote);
    }

    const vel = Math.max(0.05, velocity / 127);
    const now = audioCtx.currentTime;

    // Create oscillator + gain
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    // Attack ramp
    gain.gain.linearRampToValueAtTime(vel * 0.7, now + ATTACK);
    // Decay to sustain
    gain.gain.linearRampToValueAtTime(vel * 0.5, now + ATTACK + 0.1);

    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(now);

    activeVoices.set(midiNote, { oscillator, gain });
  }

  function noteOff(midiNote: number) {
    const voice = activeVoices.get(midiNote);
    if (!voice) return;

    const now = audioCtx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + RELEASE);
    voice.oscillator.stop(now + RELEASE + 0.01);

    activeVoices.delete(midiNote);
  }

  function setVolume(db: number) {
    // Convert dB to linear gain
    masterGain.gain.value = Math.pow(10, db / 20);
  }

  function dispose() {
    const now = audioCtx.currentTime;
    for (const [, voice] of activeVoices) {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(0, now);
      voice.oscillator.stop(now + 0.01);
    }
    activeVoices.clear();
    masterGain.disconnect();
  }

  return { noteOn, noteOff, setVolume, dispose };
}
