import { RagaDefinition } from '@/types/raga';

export const RAGA_DB: RagaDefinition[] = [
  {
    name: 'Bhoop',
    aliases: ['Bhoopali', 'Bhupali'],
    thaat: 'Kalyan',
    aroh: ['Sa', 'Re', 'Ga', 'Pa', 'Dha'],
    avroh: ['Dha', 'Pa', 'Ga', 'Re', 'Sa'],
    vadi: 'Ga',
    samvadi: 'Dha',
    allowedSwar: new Set([0, 2, 4, 7, 9]),
    varjitSwar: new Set([1, 3, 5, 6, 8, 10, 11]),
    pakad: [
      ['Ga', 'Re', 'Sa'],
      ['Sa', 'Re', 'Ga', 'Pa', 'Ga'],
      ['Dha', 'Pa', 'Ga', 'Re', 'Sa'],
      ['Pa', 'Ga', 'Re', 'Ga', 'Pa', 'Dha'],
      ['Ga', 'Pa', 'Dha'],
      ['Re', 'Ga', 'Pa', 'Dha', 'Pa', 'Ga'],
    ],
    droneType: 'Sa-Pa',
    time: 'Evening, first prahar of night',
  },
];

export function getRagaByName(name: string): RagaDefinition | undefined {
  return RAGA_DB.find(
    (r) =>
      r.name.toLowerCase() === name.toLowerCase() ||
      r.aliases.some((a) => a.toLowerCase() === name.toLowerCase())
  );
}
