import { PulseState } from '@/types/raga';

export interface PulseDetectorCallbacks {
  onPulseChange: (state: PulseState) => void;
}

const INITIAL_PULSE: PulseState = {
  detected: false,
  confidence: 0,
  bpm: null,
  medianIOI: null,
  consistency: 0,
};

const MAX_ONSETS = 24;
const MIN_IOI_MS = 80;        // filter grace notes
const MIN_BPM = 40;
const MAX_BPM = 240;
const MIN_IOI_FOR_BPM = 60000 / MAX_BPM; // ~250ms
const MAX_IOI_FOR_BPM = 60000 / MIN_BPM; // 1500ms
const DRIFT_GRADUAL = 0.05;   // 5%
const DRIFT_SUDDEN = 0.15;    // 15%

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function createPulseDetector(callbacks: PulseDetectorCallbacks) {
  const onsets: number[] = [];
  let currentState: PulseState = { ...INITIAL_PULSE };
  let prevMedianIOI: number | null = null;

  function computeState(): PulseState {
    if (onsets.length < 4) {
      return { ...INITIAL_PULSE };
    }

    // Compute inter-onset intervals
    const rawIOIs: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      rawIOIs.push(onsets[i] - onsets[i - 1]);
    }

    // Filter grace notes and out-of-range IOIs
    const iois = rawIOIs.filter(
      (ioi) => ioi >= MIN_IOI_MS && ioi >= MIN_IOI_FOR_BPM && ioi <= MAX_IOI_FOR_BPM
    );

    if (iois.length < 3) {
      return { ...INITIAL_PULSE };
    }

    const medIOI = median(iois);

    // Check for sudden tempo jump if we had a previous median
    if (prevMedianIOI !== null) {
      const drift = Math.abs(medIOI - prevMedianIOI) / prevMedianIOI;
      if (drift > DRIFT_SUDDEN) {
        // Sudden jump — reset
        prevMedianIOI = null;
        return { ...INITIAL_PULSE };
      }
    }

    // Compute consistency: fraction of IOIs within ±20% of median
    const tolerance = medIOI * 0.2;
    const consistentCount = iois.filter(
      (ioi) => Math.abs(ioi - medIOI) <= tolerance
    ).length;
    const consistency = consistentCount / iois.length;

    // Map consistency to confidence
    let confidence: number;
    if (consistency < 0.4) {
      confidence = 0;
    } else if (consistency < 0.6) {
      // Linear map 0.4-0.6 → 0.3-0.5
      confidence = 0.3 + ((consistency - 0.4) / 0.2) * 0.2;
    } else if (consistency < 0.8) {
      // Linear map 0.6-0.8 → 0.6-0.8
      confidence = 0.6 + ((consistency - 0.6) / 0.2) * 0.2;
    } else {
      // Linear map 0.8-1.0 → 0.9-1.0
      confidence = 0.9 + ((consistency - 0.8) / 0.2) * 0.1;
    }

    const bpm = Math.round(60000 / medIOI);
    const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
    const detected = confidence >= 0.6;

    // Track gradual drift
    if (detected) {
      if (prevMedianIOI !== null) {
        const drift = Math.abs(medIOI - prevMedianIOI) / prevMedianIOI;
        if (drift <= DRIFT_GRADUAL) {
          // Gradual drift — follow
          prevMedianIOI = medIOI;
        }
        // Between gradual and sudden — hold previous
      } else {
        prevMedianIOI = medIOI;
      }
    }

    return {
      detected,
      confidence,
      bpm: clampedBpm,
      medianIOI: Math.round(medIOI),
      consistency,
    };
  }

  function feedNoteOnset(timestamp: number) {
    onsets.push(timestamp);
    if (onsets.length > MAX_ONSETS) {
      onsets.splice(0, onsets.length - MAX_ONSETS);
    }

    const newState = computeState();
    // Only emit if state meaningfully changed
    if (
      newState.detected !== currentState.detected ||
      newState.bpm !== currentState.bpm ||
      Math.abs(newState.confidence - currentState.confidence) > 0.05
    ) {
      currentState = newState;
      callbacks.onPulseChange(currentState);
    }
  }

  function getState(): PulseState {
    return { ...currentState };
  }

  function reset() {
    onsets.length = 0;
    prevMedianIOI = null;
    currentState = { ...INITIAL_PULSE };
    callbacks.onPulseChange(currentState);
  }

  return {
    feedNoteOnset,
    getState,
    reset,
  };
}
