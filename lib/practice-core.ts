/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 * Refactored for branded types and strict validation.
 */

import { NoteTechnique, Observation } from './technique-types'
import { normalizeAccidental } from './domain/musical-domain'
import { FixedRingBuffer } from './domain/data-structures'
import { AppError, ERROR_CODES } from './errors/app-error'
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types'

export type { TargetNote }

/**
 * A valid note name in scientific pitch notation.
 *
 * @example "C4", "F#5", "Bb3"
 * @remarks Pattern: `^[A-G][#b]?[0-8]$`
 */
export type NoteName = string & { readonly __brand: unique symbol }

/**
 * Type guard to validate note name format.
 *
 * @param name - The string to validate.
 *
 * @remarks
 * Throws `AppError` with code `NOTE_PARSING_FAILED` if invalid.
 */
export function assertValidNoteName(name: string): asserts name is NoteName {
  if (!/^[A-G](?:b{1,2}|#{1,2})?[0-8]$/.test(name)) {
    throw new AppError({
      message: `Invalid note name format: "${name}" (expected scientific pitch notation, e.g., "A4", "Bb3", octave 0-8)`,
      code: ERROR_CODES.NOTE_PARSING_FAILED,
    })
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
    validateFrequency(frequency)
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
   * @throws {@link AppError} with code `NOTE_PARSING_FAILED` if format is invalid
   */
  static fromName(fullName: NoteName): MusicalNote {
    const components = parseNoteName(fullName)
    const { step, accidental, octave } = components
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

function validateFrequency(frequency: number): void {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new Error(`Invalid frequency: ${frequency}`)
  }
}

interface NoteComponents {
  step: string
  accidental: string
  octave: number
}

function parseNoteName(fullName: NoteName): NoteComponents {
  const match = (fullName as string).match(/^([A-G])(b{1,2}|#{1,2})?([0-8])$/)
  if (!match) {
    throw new AppError({
      message: `Invalid note name format: "${fullName}" (octave must be 0-8)`,
      code: ERROR_CODES.NOTE_PARSING_FAILED,
    })
  }

  const [, step, accidental = '', octaveStr] = match
  return {
    step,
    accidental,
    octave: parseInt(octaveStr, 10),
  }
}

// --- TYPE DEFINITIONS ---

/**
 * Defines the tolerance boundaries for matching a note.
 */
export interface MatchHysteresis {
  enter: number
  exit: number
}

/** Represents a note detected from the user's microphone input. */
export interface DetectedNote {
  pitch: string
  pitchHz: number
  cents: number
  timestamp: number
  confidence: number
}

/** The status of the practice session. */
export type PracticeStatus =
  | 'idle'
  | 'listening'
  | 'validating'
  | 'correct'
  | 'completed'

/** The complete, self-contained state of the practice session. */
export interface PracticeState {
  status: PracticeStatus
  exercise: Exercise
  currentIndex: number
  detectionHistory: readonly DetectedNote[]
  holdDuration?: number
  lastObservations?: Observation[]
  perfectNoteStreak: number
}

/** Events that can modify the practice state. */
export type PracticeEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RESET' }
  | { type: 'NOTE_DETECTED'; payload: DetectedNote }
  | { type: 'HOLDING_NOTE'; payload: { duration: number } }
  // Fired by the pipeline only when a target note is held stable.
  | { type: 'NOTE_MATCHED'; payload?: { technique: NoteTechnique; observations?: Observation[]; isPerfect?: boolean } }
  // Fired when the signal is lost.
  | { type: 'NO_NOTE_DETECTED' }

// --- PURE FUNCTIONS ---

/**
 * Converts a `TargetNote`'s pitch into a standard, parsable note name string.
 *
 * @param pitch - The pitch object from a `TargetNote`.
 * @returns A standardized branded note name string like `"C#4"`.
 */
export function formatPitchName(pitch: TargetNote['pitch']): NoteName {
  const canonicalAlter = normalizeAccidental(pitch.alter)
  const alterStr = getAlterString(canonicalAlter, pitch.alter)
  const result = `${pitch.step}${alterStr}${pitch.octave}`
  assertValidNoteName(result)
  return result
}

function getAlterString(canonicalAlter: number, originalAlter: number | string): string {
  switch (canonicalAlter) {
    case 1:
      return '#'
    case -1:
      return 'b'
    case 0:
      return ''
    default:
      throw new AppError({
        message: `Unsupported alter value: ${originalAlter}`,
        code: ERROR_CODES.DATA_VALIDATION_ERROR,
      })
  }
}

/**
 * Checks if a detected note matches a target note within a specified tolerance.
 * Short-circuits if target or detected note is undefined.
 */
export function isMatch(
  target: TargetNote | undefined,
  detected: DetectedNote | undefined,
  tolerance: number | MatchHysteresis = 25,
  isCurrentlyMatched = false,
): boolean {
  if (!target || !detected) return false

  const hysteresis = typeof tolerance === 'number' ? { enter: tolerance, exit: tolerance } : tolerance
  const actualTolerance = isCurrentlyMatched ? hysteresis.exit : hysteresis.enter

  return checkPitchAndTune(target, detected, actualTolerance)
}

/**
 * Validates both pitch name (enharmonic) and cent deviation.
 * @internal
 */
function checkPitchAndTune(target: TargetNote, detected: DetectedNote, tolerance: number): boolean {
  const targetNote = MusicalNote.fromName(formatPitchName(target.pitch))
  assertValidNoteName(detected.pitch)
  const detectedNote = MusicalNote.fromName(detected.pitch)

  const isPitchMatch = targetNote.isEnharmonic(detectedNote)
  const isInTune = Math.abs(detected.cents) < tolerance
  return isPitchMatch && isInTune
}

/**
 * Entry point for entering the matched state.
 */
export function isNewMatch(
  target: TargetNote | undefined,
  detected: DetectedNote | undefined,
  tolerance: number | MatchHysteresis = 25,
): boolean {
  return isMatch(target, detected, tolerance, false)
}

/**
 * Entry point for maintaining the matched state.
 */
export function isStillMatched(
  target: TargetNote | undefined,
  detected: DetectedNote | undefined,
  tolerance: number | MatchHysteresis = 25,
): boolean {
  return isMatch(target, detected, tolerance, true)
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
    perfectNoteStreak: 0,
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
    perfectNoteStreak: 0,
  }
}

function handleNoteDetected(state: PracticeState, payload: DetectedNote): PracticeState {
  const buffer = new FixedRingBuffer<DetectedNote, 10>(10)
  buffer.push(...state.detectionHistory.slice().reverse(), payload)
  const status = getStatusAfterDetection(state.status)
  return {
    ...state,
    detectionHistory: buffer.toArray(),
    status,
    holdDuration: status === 'listening' ? 0 : state.holdDuration,
  }
}

function getStatusAfterDetection(currentStatus: PracticeStatus): PracticeStatus {
  return currentStatus === 'validating' || currentStatus === 'correct' ? 'listening' : currentStatus
}

function handleHoldingNote(state: PracticeState, duration: number): PracticeState {
  if (state.status !== 'listening' && state.status !== 'validating') return state
  return { ...state, status: 'validating', holdDuration: duration }
}

function handleNoNoteDetected(state: PracticeState): PracticeState {
  return { ...state, detectionHistory: [], status: 'listening', holdDuration: 0 }
}

type NoteMatchedPayload = Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>['payload']

function handleNoteMatched(state: PracticeState, payload: NoteMatchedPayload): PracticeState {
  if (state.status !== 'listening' && state.status !== 'validating') return state

  const newStreak = calculateNewStreak(state, payload)
  const isLastNote = state.currentIndex >= state.exercise.notes.length - 1

  return isLastNote
    ? finalizePracticeSession(state, payload, newStreak)
    : advanceToNextNote(state, payload, newStreak)
}

function calculateNewStreak(state: PracticeState, payload: NoteMatchedPayload): number {
  const lastDetection = state.detectionHistory[0]
  const isPerfect = payload?.isPerfect ?? (lastDetection && Math.abs(lastDetection.cents) < 5)
  return isPerfect ? state.perfectNoteStreak + 1 : 0
}

function finalizePracticeSession(
  state: PracticeState,
  payload: NoteMatchedPayload,
  streak: number,
): PracticeState {
  return {
    ...state,
    status: 'completed',
    holdDuration: 0,
    lastObservations: payload?.observations ?? [],
    perfectNoteStreak: streak,
  }
}

function advanceToNextNote(
  state: PracticeState,
  payload: NoteMatchedPayload,
  streak: number,
): PracticeState {
  return {
    ...state,
    currentIndex: state.currentIndex + 1,
    status: 'correct',
    detectionHistory: [],
    holdDuration: 0,
    lastObservations: payload?.observations ?? [],
    perfectNoteStreak: streak,
  }
}
