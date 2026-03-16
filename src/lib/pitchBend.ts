import { PitchBendEvent } from '@/types/music';

export function createPitchBendLogger() {
  const events: PitchBendEvent[] = [];

  return {
    log: (value: number, timestamp: number) => {
      events.push({ value, timestamp });
    },
    getEvents: () => [...events],
    clear: () => {
      events.length = 0;
    },
  };
}
