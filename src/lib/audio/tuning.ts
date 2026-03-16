import { Swar, Octave } from '@/types/music';

export const JUST_INTONATION_RATIOS: Record<Swar, number> = {
  'Sa':        1,
  'Re_komal':  16/15,
  'Re':        9/8,
  'Ga_komal':  6/5,
  'Ga':        5/4,
  'Ma':        4/3,
  'Ma_tivra':  45/32,
  'Pa':        3/2,
  'Dha_komal': 8/5,
  'Dha':       5/3,
  'Ni_komal':  9/5,
  'Ni':        15/8,
};

export const DEFAULT_SA_FREQUENCY = 277.18;

export function getSaFrequency(saBase: number): number {
  return 440 * Math.pow(2, (saBase - 69) / 12);
}

export function getFrequency(swar: Swar, octave: Octave, saFrequency: number): number {
  const ratio = JUST_INTONATION_RATIOS[swar];
  const octaveMultiplier = octave === 'mandra' ? 0.5 : octave === 'taar' ? 2 : 1;
  return saFrequency * ratio * octaveMultiplier;
}
