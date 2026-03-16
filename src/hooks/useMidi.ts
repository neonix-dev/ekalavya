import { useState, useEffect, useRef, useCallback } from 'react';
import { NoteEvent, MidiConnectionStatus, MidiDeviceInfo } from '@/types/music';
import { initMidi, cleanupMidi } from '@/lib/midi';
import { createNoteTracker } from '@/lib/noteTracker';
import { createPitchBendLogger } from '@/lib/pitchBend';

const MAX_EVENTS = 50;

export interface UseMidiCallbacks {
  onNoteStart?: (event: NoteEvent) => void;
  onNoteEnd?: (event: NoteEvent) => void;
}

export function useMidi(saBase: number = 61, callbacks?: UseMidiCallbacks) {
  const [connectionStatus, setConnectionStatus] = useState<MidiConnectionStatus>('waiting');
  const [deviceInfo, setDeviceInfo] = useState<MidiDeviceInfo | null>(null);
  const [noteEvents, setNoteEvents] = useState<NoteEvent[]>([]);
  const [heldNotes, setHeldNotes] = useState<NoteEvent[]>([]);

  const trackerRef = useRef<ReturnType<typeof createNoteTracker> | null>(null);
  const pitchBendRef = useRef(createPitchBendLogger());
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const updateHeld = useCallback(() => {
    if (trackerRef.current) {
      setHeldNotes(trackerRef.current.getHeldNotes());
    }
  }, []);

  useEffect(() => {
    const pitchBend = pitchBendRef.current;

    const tracker = createNoteTracker(
      {
        onNoteStart: (event) => {
          setNoteEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
          updateHeld();
          callbacksRef.current?.onNoteStart?.(event);
        },
        onNoteEnd: (event) => {
          setNoteEvents((prev) => {
            const idx = prev.findIndex(
              (e) => e.midiNote === event.midiNote && e.timestamp === event.timestamp
            );
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = event;
            return updated;
          });
          updateHeld();
          callbacksRef.current?.onNoteEnd?.(event);
        },
      },
      saBase
    );

    trackerRef.current = tracker;

    initMidi({
      onConnectionChange: (status, device) => {
        setConnectionStatus(status);
        setDeviceInfo(device ?? null);
      },
      onNoteOn: (midiNote, velocity, timestamp, midiTimestamp) => {
        tracker.handleNoteOn(midiNote, velocity, timestamp, midiTimestamp);
      },
      onNoteOff: (midiNote, timestamp, midiTimestamp) => {
        tracker.handleNoteOff(midiNote, timestamp, midiTimestamp);
      },
      onPitchBend: (value, timestamp) => {
        pitchBend.log(value, timestamp);
      },
    });

    return () => {
      cleanupMidi();
      trackerRef.current = null;
    };
  }, [saBase, updateHeld]);

  const clearEvents = useCallback(() => {
    setNoteEvents([]);
    pitchBendRef.current.clear();
  }, []);

  return {
    connectionStatus,
    deviceInfo,
    noteEvents,
    heldNotes,
    clearEvents,
  };
}
