import { MidiConnectionStatus, MidiDeviceInfo } from '@/types/music';

export interface MidiCallbacks {
  onConnectionChange: (status: MidiConnectionStatus, device?: MidiDeviceInfo) => void;
  onNoteOn: (midiNote: number, velocity: number, timestamp: number, midiTimestamp: number) => void;
  onNoteOff: (midiNote: number, timestamp: number, midiTimestamp: number) => void;
  onPitchBend: (value: number, timestamp: number) => void;
}

let midiAccess: MIDIAccess | null = null;
let currentCallbacks: MidiCallbacks | null = null;

function handleMidiMessage(event: MIDIMessageEvent) {
  if (!currentCallbacks || !event.data || event.data.length < 2) return;

  const status = event.data[0];
  const cmd = status & 0xf0;
  const note = event.data[1];
  const velocity = event.data.length > 2 ? event.data[2] : 0;
  const now = performance.now();
  const midiTimestamp = event.timeStamp || 0;

  if (cmd === 0x90 && velocity > 0) {
    currentCallbacks.onNoteOn(note, velocity, now, midiTimestamp);
  } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
    currentCallbacks.onNoteOff(note, now, midiTimestamp);
  } else if (cmd === 0xe0 && event.data.length >= 3) {
    const value = (event.data[2] << 7) | event.data[1];
    currentCallbacks.onPitchBend(value, now);
  }
}

function connectInputs() {
  if (!midiAccess || !currentCallbacks) return;

  let connected = false;
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = handleMidiMessage;
    connected = true;
    currentCallbacks.onConnectionChange('connected', {
      name: input.name || 'Unknown Device',
      manufacturer: input.manufacturer || 'Unknown',
      id: input.id,
    });
    break; // use the first input
  }

  if (!connected) {
    currentCallbacks.onConnectionChange('waiting');
  }
}

export async function initMidi(callbacks: MidiCallbacks): Promise<void> {
  currentCallbacks = callbacks;

  if (!navigator.requestMIDIAccess) {
    callbacks.onConnectionChange('unsupported');
    return;
  }

  try {
    midiAccess = await navigator.requestMIDIAccess();
    midiAccess.onstatechange = () => connectInputs();
    connectInputs();
  } catch {
    callbacks.onConnectionChange('unsupported');
  }
}

export function cleanupMidi(): void {
  if (midiAccess) {
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = null;
    }
    midiAccess.onstatechange = null;
  }
  midiAccess = null;
  currentCallbacks = null;
}
