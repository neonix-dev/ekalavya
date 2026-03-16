import { Swar, NoteEvent } from './music';

// ── Phrase ──

export type PhraseDirection = 'ascending' | 'descending' | 'mixed';

export interface Phrase {
  notes: NoteEvent[];
  direction: PhraseDirection;
  startTime: number;
  endTime: number;
  emphasis: Swar | null;
  landingNote: Swar | null;
  swarSet: Set<number>;
}

// ── Raga Definition ──

export interface RagaDefinition {
  name: string;
  aliases: string[];
  thaat: string;
  aroh: Swar[];
  avroh: Swar[];
  vadi: Swar;
  samvadi: Swar;
  allowedSwar: Set<number>;
  varjitSwar: Set<number>;
  pakad: Swar[][];
  droneType: 'Sa-Pa' | 'Sa-Ma';
  time: string;
}

// ── Raga State ──

export type MelodicRegion = 'poorvanga' | 'uttaranga' | 'full';
export type EnergyLevel = 'low' | 'building' | 'peak' | 'descending';
export type MusicalPhase = 'alap' | 'jod' | 'gat';

export interface PulseState {
  detected: boolean;
  confidence: number;          // 0 to 1
  bpm: number | null;          // null if no pulse
  medianIOI: number | null;    // in ms
  consistency: number;         // 0 to 1, how regular the intervals are
}

export interface RagaCandidate {
  name: string;
  confidence: number;
  reasons: string[];
}

export interface RagaState {
  candidates: RagaCandidate[];
  confirmed: string | null;
  region: MelodicRegion;
  energy: EnergyLevel;
  recentPhrases: Phrase[];
  swarUsage: Map<number, number>;
  forbiddenSwarCount: number;
  manualOverride: string | null;
  phase: MusicalPhase;
  tempo: number | null;
  pulseConfidence: number;
  noteDensity: number;
}
