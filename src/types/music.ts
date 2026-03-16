export type Swar =
  | 'Sa'
  | 'Re_komal'
  | 'Re'
  | 'Ga_komal'
  | 'Ga'
  | 'Ma'
  | 'Ma_tivra'
  | 'Pa'
  | 'Dha_komal'
  | 'Dha'
  | 'Ni_komal'
  | 'Ni';

export type Octave = 'mandra' | 'madhya' | 'taar';

export interface NoteEvent {
  swar: Swar;
  octave: Octave;
  midiNote: number;
  velocity: number;
  timestamp: number;
  midiTimestamp: number;
  duration: number | null;
}

export interface PitchBendEvent {
  value: number;
  timestamp: number;
}

export type MidiConnectionStatus = 'waiting' | 'connected' | 'disconnected' | 'unsupported';

export interface MidiDeviceInfo {
  name: string;
  manufacturer: string;
  id: string;
}
