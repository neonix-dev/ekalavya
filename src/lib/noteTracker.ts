import { NoteEvent } from '@/types/music';
import { mapMidiNote } from './noteMapper';

export interface NoteTrackerCallbacks {
  onNoteStart: (event: NoteEvent) => void;
  onNoteEnd: (event: NoteEvent) => void;
}

export function createNoteTracker(
  callbacks: NoteTrackerCallbacks,
  saBase: number = 61
) {
  const heldNotes = new Map<number, NoteEvent>();

  function handleNoteOn(
    midiNote: number,
    velocity: number,
    timestamp: number,
    midiTimestamp: number
  ) {
    // If note already held (re-struck without release), end it first
    const existing = heldNotes.get(midiNote);
    if (existing) {
      const ended: NoteEvent = {
        ...existing,
        duration: timestamp - existing.timestamp,
      };
      heldNotes.delete(midiNote);
      callbacks.onNoteEnd(ended);
    }

    const { swar, octave } = mapMidiNote(midiNote, saBase);
    const event: NoteEvent = {
      swar,
      octave,
      midiNote,
      velocity,
      timestamp,
      midiTimestamp,
      duration: null,
    };

    heldNotes.set(midiNote, event);
    callbacks.onNoteStart(event);
  }

  function handleNoteOff(
    midiNote: number,
    timestamp: number,
    _midiTimestamp: number
  ) {
    const held = heldNotes.get(midiNote);
    if (!held) return; // orphan note-off

    const ended: NoteEvent = {
      ...held,
      duration: timestamp - held.timestamp,
    };
    heldNotes.delete(midiNote);
    callbacks.onNoteEnd(ended);
  }

  function getHeldNotes(): NoteEvent[] {
    return Array.from(heldNotes.values());
  }

  return { handleNoteOn, handleNoteOff, getHeldNotes };
}
