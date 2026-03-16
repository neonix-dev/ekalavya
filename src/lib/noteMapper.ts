import { Swar, Octave } from '@/types/music';

export const SWAR_LIST: Swar[] = [
  'Sa', 'Re_komal', 'Re', 'Ga_komal', 'Ga', 'Ma',
  'Ma_tivra', 'Pa', 'Dha_komal', 'Dha', 'Ni_komal', 'Ni',
];

export function mapMidiNote(
  midiNote: number,
  saBase: number = 61
): { swar: Swar; octave: Octave } {
  const swarIndex = ((midiNote - saBase) % 12 + 12) % 12;
  const octaveOffset = Math.floor((midiNote - saBase) / 12);

  let octave: Octave;
  if (octaveOffset < 0) {
    octave = 'mandra';
  } else if (octaveOffset > 0) {
    octave = 'taar';
  } else {
    octave = 'madhya';
  }

  return { swar: SWAR_LIST[swarIndex], octave };
}
