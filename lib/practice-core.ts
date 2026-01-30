/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 */

import { NoteTechnique, Observation } from './technique-types'
import { normalizeAccidental } from './domain/musical-domain'
import { FixedRingBuffer } from './domain/data-structures'
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types'

export type { TargetNote }

/**
 * A valid note name in scientific pitch notation.
 *
 * @example "C4", "F#5", "Bb3"
 *
 * @remarks
 * Pattern: `^[A-G][#b]?(?:[0-8])$`
 */
export type NoteName = string & { readonly __brand: unique symbol }

/**
 * Type guard to validate note name format.
 *
 * @param name - The string to validate.
 * @throws Error - if the format is invalid.
 */
export function assertValidNoteName(name: string): asserts name is NoteName {
  if (!/^[A-G](?:b{1,2}|#{1,2})?-?\d+$/.test(name)) {
    throw new Error(`Invalid note name format: "${name}"`)
  }
}

// --- MUSICAL NOTE LOGIC (inlined to prevent test runner issues) ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const STEP_VALUES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const ACCIDENTAL_MODIFIERS: Record<string, number> = {
  '##': 2,
  '#': 1,
  '': 0,
  b: -1,
  bb: -2,
}

const A4_FREQUENCY = 440
const A4_MIDI = 69

/**
 * Represents a musical note with properties derived from its frequency.
 * @remarks
 * The factory methods (`fromFrequency`, `fromMidi`, `fromName`) are strict and will
 * throw errors on invalid input, such as non-finite numbers or malformed note names.
 * This is intentional to catch data or programming errors early.
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

  /**
   * Parses a note name in scientific pitch notation.
   *
   * @param fullName - A valid note name (e.g., "C4", "F#5", "Bb3")
   * @returns A MusicalNote instance
   * @throws Error - if format is invalid
   *
   * @example
   * MusicalNote.fromName("C#4" as NoteName); // ✅ OK
   * MusicalNote.fromName("H9" as NoteName);  // ❌ Throws Error
   */
  static fromName(fullName: NoteName): MusicalNote {
    const match = fullName.match(/^([A-G])(b{1,2}|#{1,2})?(-?\d+)$/)
    if (!match) {
      throw new Error(`Invalid note name format: "${fullName}"`)
    }

    const [, step, accidental = '', octaveStr] = match
    const octave = parseInt(octaveStr, 10)

    if (!Number.isInteger(octave)) {
      throw new Error(`Invalid octave: "${octaveStr}" in note "${fullName}"`)
    }

    const stepValue = STEP_VALUES[step]
    const accidentalValue = ACCIDENTAL_MODIFIERS[accidental]

    if (stepValue === undefined || accidentalValue === undefined) {
      throw new Error(`Unknown note components: step="${step}", accidental="${accidental}"`)
    }

    const midiNumber = (octave + 1) * 12 + stepValue + accidentalValue
    return MusicalNote.fromMidi(midiNumber)
  }

  get nameWithOctave(): NoteName {
    const result = `${this.noteName}${this.octave}`
    assertValidNoteName(result)
    return result
  }
}

// --- TYPE DEFINITIONS ---

/**
 * Defines the tolerance boundaries for matching a note.
 * Uses different values for entering and exiting the matched state
 * to prevent oscillation (hysteresis).
 */
export interface MatchHysteresis {
  /** Tolerance in cents to consider a note as "starting to match". */
  enter: number
  /** Tolerance in cents to consider a note as "no longer matching". */
  exit: number
}

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
  | 'validating' // Target note detected, waiting for hold time
  | 'correct' // Target note held for required time (transient)
  | 'completed' // The entire exercise is finished

/** The complete, self-contained state of the practice session. */
export interface PracticeState {
  status: PracticeStatus
  exercise: Exercise
  currentIndex: number
  // The history of recent detections, used for UI feedback.
  detectionHistory: readonly DetectedNote[]
  // The current duration the target note has been held (ms).
  holdDuration?: number
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
  // Fired when a note matches target but is still being validated.
  | { type: 'HOLDING_NOTE'; payload: { duration: number } }
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
export function formatPitchName(pitch: TargetNote['pitch']): NoteName {
  const canonicalAlter = normalizeAccidental(pitch.alter)
  let alterStr = ''
  switch (canonicalAlter) {
    case 1:
      alterStr = '#'
      break
    case -1:
      alterStr = 'b'
      break
    case 0:
      alterStr = ''
      break
    default:
      throw new Error(`Unsupported alter value: ${pitch.alter}`)
  }
  const result = `${pitch.step}${alterStr}${pitch.octave}`
  assertValidNoteName(result)
  return result
}

/**
 * Checks if a detected note matches a target note within a specified tolerance.
 * Supports hysteresis to prevent rapid toggling near the tolerance boundary.
 *
 * @param target - The expected musical note.
 * @param detected - The note detected from audio.
 * @param tolerance - Either a fixed cent tolerance or a `MatchHysteresis` object.
 * @param isCurrentlyMatched - Whether the note was already matching in the previous frame.
 * @returns True if the detected note is considered a match.
 */
export function isMatch(
  target: TargetNote,
  detected: DetectedNote,
  tolerance: number | MatchHysteresis = 25,
  isCurrentlyMatched = false,
): boolean {
  if (!target || !detected) {
    return false
  }

  const h: MatchHysteresis =
    typeof tolerance === 'number' ? { enter: tolerance, exit: tolerance } : tolerance

  const actualTolerance = isCurrentlyMatched ? h.exit : h.enter

  const targetPitchName = formatPitchName(target.pitch)
  const targetNote = MusicalNote.fromName(targetPitchName)
  const detectedPitch = detected.pitch
  assertValidNoteName(detectedPitch)
  const detectedNote = MusicalNote.fromName(detectedPitch)
  const isPitchMatch = targetNote.isEnharmonic(detectedNote)
  const isInTune = Math.abs(detected.cents) < actualTolerance
  return isPitchMatch && isInTune
}

/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState {
  switch (event.type) {
    case 'START':
      return handleStart(state)
    case 'STOP':
    case 'RESET':
      return handleStopReset(state)
    case 'NOTE_DETECTED':
      return handleNoteDetected(state, event.payload)
    case 'HOLDING_NOTE':
      return handleHoldingNote(state, event.payload.duration)
    case 'NO_NOTE_DETECTED':
      return handleNoNoteDetected(state)
    case 'NOTE_MATCHED':
      return handleNoteMatched(state, event.payload)
    default:
      return state
  }
}

function handleStart(state: PracticeState): PracticeState {
  return {
    ...state,
    status: 'listening',
    currentIndex: 0,
    detectionHistory: [],
    holdDuration: 0,
    lastObservations: [],
  }
}

function handleStopReset(state: PracticeState): PracticeState {
  return {
    ...state,
    status: 'idle',
    currentIndex: 0,
    detectionHistory: [],
    holdDuration: 0,
    lastObservations: [],
  }
}

function handleNoteDetected(state: PracticeState, payload: DetectedNote): PracticeState {
  const buffer = new FixedRingBuffer<DetectedNote, 10>(10)
  buffer.push(...[payload, ...state.detectionHistory])
  // Transition back to listening if we were validating/correct and received a detection
  const status =
    state.status === 'validating' || state.status === 'correct' ? 'listening' : state.status
  return {
    ...state,
    detectionHistory: buffer.toArray(),
    status,
    holdDuration: status === 'listening' ? 0 : state.holdDuration,
  }
}

function handleHoldingNote(state: PracticeState, duration: number): PracticeState {
  if (state.status !== 'listening' && state.status !== 'validating') return state
  return { ...state, status: 'validating', holdDuration: duration }
}

function handleNoNoteDetected(state: PracticeState): PracticeState {
  return { ...state, detectionHistory: [], status: 'listening', holdDuration: 0 }
}

function handleNoteMatched(
  state: PracticeState,
  payload: Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>['payload'],
): PracticeState {
  if (state.status !== 'listening' && state.status !== 'validating') return state

  const isLastNote = state.currentIndex >= state.exercise.notes.length - 1
  if (isLastNote) {
    return {
      ...state,
      status: 'completed',
      holdDuration: 0,
      lastObservations: payload?.observations ?? [],
    }
  } else {
    return {
      ...state,
      currentIndex: state.currentIndex + 1,
      status: 'correct',
      detectionHistory: [],
      holdDuration: 0,
      lastObservations: payload?.observations ?? [],
    }
  }
}
