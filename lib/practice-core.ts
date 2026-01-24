/**
 * @file practice-core.ts
 *
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 */

// Use the actual Note type from the exercise definitions as our TargetNote.
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types'

// --- MUSICAL NOTE LOGIC (inlined to prevent test runner issues) ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
type NoteName = (typeof NOTE_NAMES)[number]
const A4_FREQUENCY = 440
const A4_MIDI = 69

const ENHARMONIC_MAP: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
}

export class MusicalNote {
  private constructor(
    public readonly frequency: number,
    public readonly midiNumber: number,
    public readonly noteName: string,
    public readonly octave: number,
    public readonly centsDeviation: number,
  ) {}

  isEnharmonic(other: MusicalNote): boolean {
    return this.midiNumber === other.midiNumber
  }

  static fromFrequency(frequency: number): MusicalNote {
    if (frequency <= 0) throw new Error(`Invalid frequency: ${frequency}`)
    const midiNumber = A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY)
    const roundedMidi = Math.round(midiNumber)
    const centsDeviation = (midiNumber - roundedMidi) * 100
    const noteIndex = roundedMidi % 12
    const octave = Math.floor(roundedMidi / 12) - 1
    const noteName = NOTE_NAMES[noteIndex]
    return new MusicalNote(frequency, roundedMidi, noteName, octave, centsDeviation)
  }

  static fromMidi(midiNumber: number): MusicalNote {
    const frequency = A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI) / 12)
    return MusicalNote.fromFrequency(frequency)
  }

  static fromName(fullName: string): MusicalNote {
    const match = fullName.match(/^([A-G][#b]?)(-?\d+)$/)
    if (!match) throw new Error(`Invalid full note name format: ${fullName}`)
    const [, name, octaveStr] = match
    const octave = parseInt(octaveStr, 10)

    let sharpName = name;
    if (name.endsWith('b')) {
        const equivalent = Object.keys(ENHARMONIC_MAP).find(k => ENHARMONIC_MAP[k] === name);
        sharpName = equivalent || name;
    }

    const noteIndex = NOTE_NAMES.indexOf(sharpName as NoteName)
    if (noteIndex === -1) throw new Error(`Could not find note index for: ${sharpName}`)

    const midiNumber = (octave + 1) * 12 + noteIndex;
    return MusicalNote.fromMidi(midiNumber)
  }

  get nameWithOctave(): string {
    return `${this.noteName}${this.octave}`
  }
}


// --- TYPE DEFINITIONS ---

/** Represents a note detected from the user's microphone input. */
export interface DetectedNote {
  pitch: string // e.g., "G4"
  cents: number
  timestamp: number
  confidence: number
}

/** The status of the practice session. */
export type PracticeStatus =
  | 'idle'
  | 'listening'
  | 'correct'
  | 'completed'

/** The complete, self-contained state of the practice session. */
export interface PracticeState {
  status: PracticeStatus
  exercise: Exercise
  currentIndex: number
  history: DetectedNote[]
}

/** Events that can modify the practice state. */
export type PracticeEvent =
  | { type: 'NOTE_DETECTED'; payload: DetectedNote }
  | { type: 'NOTE_VALIDATED'; payload: DetectedNote }
  | { type: 'NO_NOTE_DETECTED' }
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RESET' }

// --- PURE FUNCTIONS ---

/**
 * Checks if a detected note matches the target note.
 */
export function isMatch(
  target: TargetNote,
  detected: DetectedNote,
  centsTolerance = 25,
): boolean {
  if (!target || !detected) {
    return false
  }

  try {
    const targetAlter = target.pitch.alter ?? ''
    const targetPitchName = `${target.pitch.step}${targetAlter}${target.pitch.octave}`
    const targetNote = MusicalNote.fromName(targetPitchName)
    const detectedNote = MusicalNote.fromName(detected.pitch)
    const isPitchMatch = targetNote.isEnharmonic(detectedNote)
    const isInTune = Math.abs(detected.cents) < centsTolerance
    return isPitchMatch && isInTune
  } catch (error) {
    console.error('Error comparing notes:', error)
    return false
  }
}

/**
 * The core reducer function for the practice logic.
 */
export function reducePracticeEvent(
  state: PracticeState,
  event: PracticeEvent,
): PracticeState {
  switch (event.type) {
    case 'START':
      return { ...state, status: 'listening', currentIndex: 0, history: [] }

    case 'STOP':
    case 'RESET':
      return { ...state, status: 'idle', currentIndex: 0, history: [] }

    case 'NO_NOTE_DETECTED':
      // Can be used to reset visual feedback, but doesn't change core state
      return state

    case 'NOTE_DETECTED':
      // This event is now for real-time feedback; it doesn't advance the state.
      return { ...state, history: [...state.history, event.payload] }

    case 'NOTE_VALIDATED': {
      const { exercise, currentIndex } = state
      const targetNote = exercise.notes[currentIndex]
      if (!targetNote) return state // Should not happen

      if (isMatch(targetNote, event.payload)) {
        const isLastNote = currentIndex >= exercise.notes.length - 1
        if (isLastNote) {
          return { ...state, status: 'completed' }
        } else {
          // Advance to the next note and reset history for that note
          return { ...state, status: 'correct', currentIndex: currentIndex + 1, history: [] }
        }
      }
      // If a note was validated but it doesn't match, ignore it.
      // This can happen in race conditions. The pipeline is the source of truth.
      return state
    }
    default:
      return state
  }
}
