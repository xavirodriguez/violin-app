/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 */

// Use the actual Note type from the exercise definitions as our TargetNote.
import type { Exercise } from '@/lib/exercises/types'
import { NoteTechnique, Observation } from './technique-types'
export type { Note as TargetNote } from '@/lib/exercises/types'

// --- MUSICAL NOTE LOGIC (inlined to prevent test runner issues) ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
type NoteName = (typeof NOTE_NAMES)[number]
const A4_FREQUENCY = 440
const A4_MIDI = 69

/**
 * Represents a musical note with properties derived from its frequency.
 */
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
    if (!Number.isFinite(frequency) || frequency <= 0) {
      throw new Error(`Invalid frequency: ${frequency}`)
    }
    const midiNumber = A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY)
    const roundedMidi = Math.round(midiNumber)
    const centsDeviation = (midiNumber - roundedMidi) * 100
    const noteIndex = ((roundedMidi % 12) + 12) % 12
    const octave = Math.floor(roundedMidi / 12) - 1
    const noteName = NOTE_NAMES[noteIndex]
    return new MusicalNote(frequency, roundedMidi, noteName, octave, centsDeviation)
  }

  static fromMidi(midiNumber: number): MusicalNote {
    if (!Number.isFinite(midiNumber)) {
      throw new Error(`Invalid MIDI number: ${midiNumber}`)
    }
    const frequency = A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI) / 12)
    return MusicalNote.fromFrequency(frequency)
  }

  static fromName(fullName: string): MusicalNote {
    // A stricter regex that requires the octave number.
    const match = fullName.match(/^([A-G])(b{1,2}|#{1,2})?(-?\d+)$/)
    if (!match) {
      throw new Error(`Invalid note name format: "${fullName}"`)
    }

    const [, step, accidental, octaveStr] = match
    const octave = parseInt(octaveStr, 10)
    if (!Number.isFinite(octave)) {
      throw new Error(`Invalid octave: ${octaveStr}`)
    }

    const stepIndex = NOTE_NAMES.indexOf(step as any)
    let alter = 0
    if (accidental) {
      if (accidental === '#') alter = 1
      else if (accidental === '##') alter = 2
      else if (accidental === 'b') alter = -1
      else if (accidental === 'bb') alter = -2
    }

    const midiNumber = (octave + 1) * 12 + stepIndex + alter
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
  // Advanced technique observations for the last completed note.
  lastObservations?: Observation[]
}

/** Events that can modify the practice state. */
export type PracticeEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RESET' }
  // Fired continuously from the pipeline for UI feedback.
  | { type: 'NOTE_DETECTED'; payload: DetectedNote }
  // Fired by the pipeline only when a target note is held stable.
  | { type: 'NOTE_MATCHED'; payload?: { technique: NoteTechnique; observations?: Observation[] } }
  // Fired when the signal is lost.
  | { type: 'NO_NOTE_DETECTED' }

// --- PURE FUNCTIONS ---

/**
 * Converts a `TargetNote`'s pitch into a standard, parsable note name string.
 *
 * @remarks
 * This function handles various `alter` formats, including numeric (`1`, `-1`) and
 * string-based (`"sharp"`, `"#"`), normalizing them into a format that `MusicalNote`
 * can parse (e.g., "C#4"). It will throw an error if the `alter` value is
 * unsupported, as this indicates a data validation issue upstream.
 *
 * @param pitch - The pitch object from a `TargetNote`.
 * @returns A standardized note name string like `"C#4"` or `"Bb3"`.
 */
export function formatPitchName(pitch: TargetNote['pitch']): string {
  let alterStr = ''
  switch (pitch.alter) {
    case 1:
    case 'sharp':
    case '#':
      alterStr = '#'
      break
    case -1:
    case 'flat':
    case 'b':
      alterStr = 'b'
      break
    case 2:
    case 'double-sharp':
    case '##':
      alterStr = '##'
      break
    case -2:
    case 'double-flat':
    case 'bb':
      alterStr = 'bb'
      break
    case 0:
    case undefined:
    case null:
      alterStr = ''
      break
    default:
      // Treat any other value as a data error from the exercise source.
      throw new Error(`Unsupported alter value: ${pitch.alter}`)
  }
  return `${pitch.step}${alterStr}${pitch.octave}`
}

/**
 * Checks if a detected note matches a target note within a specified tolerance.
 */
export function isMatch(target: TargetNote, detected: DetectedNote, centsTolerance = 25): boolean {
  if (!target || !detected) {
    return false
  }

  try {
    const targetPitchName = formatPitchName(target.pitch)
    const targetNote = MusicalNote.fromName(targetPitchName)
    const detectedNote = MusicalNote.fromName(detected.pitch)
    const isPitchMatch = targetNote.isEnharmonic(detectedNote)
    const isInTune = Math.abs(detected.cents) < centsTolerance
    return isPitchMatch && isInTune
  } catch (error) {
    throw error
  }
}

/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState {
  switch (event.type) {
    case 'START':
      return {
        ...state,
        status: 'listening',
        currentIndex: 0,
        detectionHistory: [],
        lastObservations: [],
      }

    case 'STOP':
    case 'RESET':
      return {
        ...state,
        status: 'idle',
        currentIndex: 0,
        detectionHistory: [],
        lastObservations: [],
      }

    case 'NOTE_DETECTED': {
      const history = [event.payload, ...state.detectionHistory].slice(0, 10)
      return { ...state, detectionHistory: history }
    }

    case 'NO_NOTE_DETECTED':
      return { ...state, detectionHistory: [] }

    case 'NOTE_MATCHED': {
      if (state.status !== 'listening') return state

      const isLastNote = state.currentIndex >= state.exercise.notes.length - 1
      if (isLastNote) {
        return {
          ...state,
          status: 'completed',
          lastObservations: event.payload?.observations ?? []
        }
      } else {
        return {
          ...state,
          currentIndex: state.currentIndex + 1,
          detectionHistory: [],
          lastObservations: event.payload?.observations ?? []
        }
      }
    }

    default:
      return state
  }
}
