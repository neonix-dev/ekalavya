import { useState, useEffect, useRef, useCallback } from 'react';
import { NoteEvent } from '@/types/music';
import { Phrase, RagaState, PulseState } from '@/types/raga';
import {
  createPhraseDetector,
  PhraseDetectorConfig,
  DEFAULT_PHRASE_CONFIG,
} from '@/lib/raga/phraseDetector';
import { createRagaStateEngine } from '@/lib/raga/ragaState';
import { createPulseDetector } from '@/lib/raga/pulseDetector';

const INITIAL_STATE: RagaState = {
  candidates: [],
  confirmed: null,
  region: 'full',
  energy: 'low',
  recentPhrases: [],
  swarUsage: new Map(),
  forbiddenSwarCount: 0,
  manualOverride: null,
  phase: 'alap',
  tempo: null,
  pulseConfidence: 0,
  noteDensity: 0,
};

const INITIAL_PULSE: PulseState = {
  detected: false,
  confidence: 0,
  bpm: null,
  medianIOI: null,
  consistency: 0,
};

export function useRaga() {
  const [ragaState, setRagaState] = useState<RagaState>(INITIAL_STATE);
  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [completedPhrases, setCompletedPhrases] = useState<Phrase[]>([]);
  const [phraseConfig, setPhraseConfigState] = useState<PhraseDetectorConfig>(DEFAULT_PHRASE_CONFIG);
  const [pulseState, setPulseState] = useState<PulseState>(INITIAL_PULSE);

  const ragaEngineRef = useRef<ReturnType<typeof createRagaStateEngine> | null>(null);
  const phraseDetectorRef = useRef<ReturnType<typeof createPhraseDetector> | null>(null);
  const pulseDetectorRef = useRef<ReturnType<typeof createPulseDetector> | null>(null);

  useEffect(() => {
    const ragaEngine = createRagaStateEngine({
      onStateChange: (state) => setRagaState(state),
    });
    ragaEngineRef.current = ragaEngine;

    const phraseDetector = createPhraseDetector({
      onPhraseComplete: (phrase) => {
        setCompletedPhrases((prev) => [...prev, phrase]);
        setCurrentPhrase(null);
        ragaEngine.feedPhrase(phrase);
      },
      onPhraseUpdate: (phrase) => {
        setCurrentPhrase(phrase);
      },
    });
    phraseDetectorRef.current = phraseDetector;

    const pulseDetector = createPulseDetector({
      onPulseChange: (state) => {
        setPulseState(state);
        ragaEngine.setPulseState(state);
      },
    });
    pulseDetectorRef.current = pulseDetector;

    return () => {
      phraseDetector.flush();
      phraseDetectorRef.current = null;
      ragaEngineRef.current = null;
      pulseDetectorRef.current = null;
    };
  }, []);

  const feedNote = useCallback((event: NoteEvent) => {
    phraseDetectorRef.current?.feedNote(event);
    ragaEngineRef.current?.feedNote(event);
    pulseDetectorRef.current?.feedNoteOnset(event.timestamp);
  }, []);

  const updateNoteDuration = useCallback((midiNote: number, duration: number) => {
    phraseDetectorRef.current?.updateNoteDuration(midiNote, duration);
  }, []);

  const setManualOverride = useCallback((ragaName: string | null) => {
    ragaEngineRef.current?.setManualOverride(ragaName);
  }, []);

  const setPhraseConfig = useCallback((config: Partial<PhraseDetectorConfig>) => {
    setPhraseConfigState((prev) => {
      const next = { ...prev, ...config };
      phraseDetectorRef.current?.setConfig(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    phraseDetectorRef.current?.reset();
    ragaEngineRef.current?.reset();
    pulseDetectorRef.current?.reset();
    setCurrentPhrase(null);
    setCompletedPhrases([]);
    setRagaState(INITIAL_STATE);
    setPulseState(INITIAL_PULSE);
  }, []);

  return {
    ragaState,
    currentPhrase,
    completedPhrases,
    feedNote,
    updateNoteDuration,
    setManualOverride,
    phraseConfig,
    setPhraseConfig,
    reset,
    pulseState,
  };
}
