/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 */

// Use the actual Note type from the exercise definitions as our TargetNote.
import type { Exercise } from '@/lib/exercises/types'
export type { Note as TargetNote } from '@/lib/exercises/types'

// --- MUSICAL NOTE LOGIC (inlined to prevent test runner issues) ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
type NoteName = (typeof NOTE_NAMES)[number]
const A4_FREQUENCY = 440
const A4_MIDI = 69

const ENHARMONIC_MAP: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
}

/**
 * Represents a musical note with properties derived from its frequency.
 *
 * @remarks
 * This class provides a robust way to handle musical notes, including conversion
 * from frequency, MIDI number, and standard notation (e.g., "A#4"). It also
 * handles enharmonic equivalence (e.g., C# is the same as Db).
 *
 * The constructor is private; instances should be created using one of the
 * static `from...` methods.
 */
export class MusicalNote {
  /**
   * @internal
   */
  private constructor(
    public readonly frequency: number,
    public readonly midiNumber: number,
    public readonly noteName: string,
    public readonly octave: number,
    public readonly centsDeviation: number,
  ) {}

  /**
   * Checks if another `MusicalNote` is enharmonically equivalent to this one.
   *
   * @remarks
   * Two notes are enharmonic if they represent the same pitch but have different
   * names (e.g., C# and Db). This is determined by comparing their MIDI numbers.
   *
   * @param other - The `MusicalNote` to compare against.
   * @returns `true` if the notes are enharmonically equivalent.
   */
  isEnharmonic(other: MusicalNote): boolean {
    return this.midiNumber === other.midiNumber
  }

  /**
   * Creates a `MusicalNote` instance from a given frequency in Hertz.
   *
   * @remarks
   * This is the core factory method. All other `from...` methods ultimately
   * use this calculation. It will throw an error if the frequency is zero or negative.
   *
   * @param frequency - The frequency of the note in Hz.
   * @returns A new `MusicalNote` instance.
   */
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

  /**
   * Creates a `MusicalNote` instance from a standard MIDI note number.
   *
   * @param midiNumber - The MIDI number (e.g., 69 for A4).
   * @returns A new `MusicalNote` instance.
   */
  static fromMidi(midiNumber: number): MusicalNote {
    const frequency = A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI) / 12)
    return MusicalNote.fromFrequency(frequency)
  }

  /**
   * Creates a `MusicalNote` instance from its standard notation name.
   *
   * @remarks
   * This method parses a string like "C#4" or "Gb-1". It correctly handles
   * both sharp (#) and flat (b) accidentals by converting flats to their
   * sharp equivalents internally.
   *
   * @param fullName - The note name including octave (e.g., "A#4").
   * @returns A new `MusicalNote` instance.
   */
  static fromName(fullName: string): MusicalNote {
    const match = fullName.match(/^([A-G][#b]?)(-?\d+)$/)
    if (!match) throw new Error(`Invalid full note name format: ${fullName}`)
    const [, name, octaveStr] = match
    const octave = parseInt(octaveStr, 10)

    let sharpName = name
    if (name.endsWith('b')) {
      const equivalent = Object.keys(ENHARMONIC_MAP).find((k) => ENHARMONIC_MAP[k] === name)
      sharpName = equivalent || name
    }

    const noteIndex = NOTE_NAMES.indexOf(sharpName as NoteName)
    if (noteIndex === -1) throw new Error(`Could not find note index for: ${sharpName}`)

    const midiNumber = (octave + 1) * 12 + noteIndex
    return MusicalNote.fromMidi(midiNumber)
  }

  /**
   * Returns the standard note name including the octave (e.g., "C#4").
   */
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
  | 'idle' // Not yet started
  | 'listening' // Actively waiting for user input
  | 'completed' // The entire exercise is finished

/** The complete, self-contained state of the practice session. */
export interface PracticeState {
  status: PracticeStatus
  exercise: Exercise
  currentIndex: number
  // The history of recent detections, used for UI feedback.
  detectionHistory: DetectedNote[]
}

/** Events that can modify the practice state. */
export type PracticeEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RESET' }
  // Fired continuously from the pipeline for UI feedback.
  | { type: 'NOTE_DETECTED'; payload: DetectedNote }
  // Fired by the pipeline only when a target note is held stable.
  | { type: 'NOTE_MATCHED' }
  // Fired when the signal is lost.
  | { type: 'NO_NOTE_DETECTED' }

// --- PURE FUNCTIONS ---

/**
 * Checks if a detected note matches a target note within a specified tolerance.
 *
 * @remarks
 * This function is the core of the practice mode's validation logic. A match occurs if:
 * 1. Both the target and detected notes are valid `MusicalNote` objects.
 * 2. The notes are enharmonically equivalent (e.g., C# matches Db).
 * 3. The detected note's pitch is within the `centsTolerance` of the target note.
 *
 * It gracefully handles parsing errors by logging them and returning `false`.
 *
 * @param target - The `TargetNote` from the current exercise.
 * @param detected - The `DetectedNote` from the audio input pipeline.
 * @param centsTolerance - The maximum allowed pitch deviation in cents.
 * @returns `true` if the detected note is a valid match for the target.
 */
export function isMatch(target: TargetNote, detected: DetectedNote, centsTolerance = 25): boolean {
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
 * The core reducer for the practice mode, handling all state transitions.
 *
 * @remarks
 * This is a pure function that takes the current state and an event, and returns
 * a new, immutable state. It is the single source of truth for the practice
 * session's logic, responsible for starting, stopping, advancing to the next
 * note, and handling real-time feedback events. It does not perform any side
 * effects.
 *
 * @param state - The current `PracticeState` of the session.
 * @param event - The `PracticeEvent` that occurred.
 * @returns The new `PracticeState` after applying the event logic.
 */
export function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState {
  switch (event.type) {
    case 'START':
      return {
        ...state,
        status: 'listening',
        currentIndex: 0,
        detectionHistory: [],
      }

    case 'STOP':
    case 'RESET':
      return {
        ...state,
        status: 'idle',
        currentIndex: 0,
        detectionHistory: [],
      }

    case 'NOTE_DETECTED': {
      // Keep a small, rolling history of the last few detections for UI feedback.
      const history = [event.payload, ...state.detectionHistory].slice(0, 10)
      return { ...state, detectionHistory: history }
    }

    case 'NO_NOTE_DETECTED':
      // Clear history on signal loss to prevent stale UI feedback.
      return { ...state, detectionHistory: [] }

    case 'NOTE_MATCHED': {
      if (state.status !== 'listening') return state

      const isLastNote = state.currentIndex >= state.exercise.notes.length - 1
      if (isLastNote) {
        return { ...state, status: 'completed' }
      } else {
        return {
          ...state,
          currentIndex: state.currentIndex + 1,
          detectionHistory: [], // Clear history for the next note.
        }
      }
    }

    default:
      return state
  }
}
