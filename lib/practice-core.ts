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
  const noteRegex = /^[A-G](?:b{1,2}|#{1,2})?[0-8]$/
  const isValid = noteRegex.test(name)

  if (!isValid) {
    const message = `Invalid note name format: "${name}" (expected scientific pitch notation, e.g., "A4", "Bb3", octave 0-8)`
    throw new AppError({
      message,
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
    const selfMidi = this.midiNumber
    const otherMidi = other.midiNumber
    const isSamePitch = selfMidi === otherMidi

    const result = isSamePitch
    return result
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
    const isNumberValid = Number.isFinite(midiNumber)
    if (!isNumberValid) {
      const errorMsg = `Invalid MIDI number: ${midiNumber}`
      throw new Error(errorMsg)
    }

    const interval = (midiNumber - A4_MIDI) / 12
    const frequency = A4_FREQUENCY * Math.pow(2, interval)
    const note = MusicalNote.fromFrequency(frequency)

    return note
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
    const namePart = this.noteName
    const octavePart = this.octave
    const result = `${namePart}${octavePart}`

    assertValidNoteName(result)
    return result as NoteName
  }
}

function validateFrequency(frequency: number): void {
  const isFinite = Number.isFinite(frequency)
  const isPositive = frequency > 0
  const isValid = isFinite && isPositive

  if (!isValid) {
    const errorPrefix = 'Invalid frequency'
    throw new Error(`${errorPrefix}: ${frequency}`)
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
export type PracticeStatus = 'idle' | 'listening' | 'validating' | 'correct' | 'completed'

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
  | {
      type: 'NOTE_MATCHED'
      payload?: { technique: NoteTechnique; observations?: Observation[]; isPerfect?: boolean }
    }
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
export function isMatch(params: {
  target: TargetNote | undefined
  detected: DetectedNote | undefined
  tolerance?: number | MatchHysteresis
  matchStatus?: 'initial' | 'maintaining'
}): boolean {
  const { target, detected, tolerance = 25, matchStatus = 'initial' } = params
  if (!target || !detected) return false

  const hysteresis =
    typeof tolerance === 'number' ? { enter: tolerance, exit: tolerance } : tolerance
  const actualTolerance = matchStatus === 'maintaining' ? hysteresis.exit : hysteresis.enter

  return checkPitchAndTune({ target, detected, tolerance: actualTolerance })
}

/**
 * Validates both pitch name (enharmonic) and cent deviation.
 * @internal
 */
function checkPitchAndTune(params: {
  target: TargetNote
  detected: DetectedNote
  tolerance: number
}): boolean {
  const { target, detected, tolerance } = params
  const targetNoteName = formatPitchName(target.pitch)
  const targetNote = MusicalNote.fromName(targetNoteName)
  const detectedNoteName = detected.pitch as NoteName
  assertValidNoteName(detectedNoteName)
  const detectedNote = MusicalNote.fromName(detectedNoteName)

  const isPitchMatch = targetNote.isEnharmonic(detectedNote)
  const isInTune = Math.abs(detected.cents) < tolerance
  return isPitchMatch && isInTune
}

/**
 * Entry point for entering the matched state.
 */
export function isNewMatch(params: {
  target: TargetNote | undefined
  detected: DetectedNote | undefined
  tolerance?: number | MatchHysteresis
}): boolean {
  const { target, detected, tolerance = 25 } = params
  const matchStatus = 'initial'
  const isMatched = isMatch({ target, detected, tolerance, matchStatus })

  return isMatched
}

/**
 * Entry point for maintaining the matched state.
 */
export function isStillMatched(params: {
  target: TargetNote | undefined
  detected: DetectedNote | undefined
  tolerance?: number | MatchHysteresis
}): boolean {
  const { target, detected, tolerance = 25 } = params
  const matchStatus = 'maintaining'
  const isStillMatchedResult = isMatch({ target, detected, tolerance, matchStatus })

  return isStillMatchedResult
}

/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState {
  const handler = getEventHandler(event.type)
  const resultState = handler ? handler(state, event) : state

  return resultState
}

function getEventHandler(type: string) {
  const handlers: Record<string, (s: PracticeState, e: PracticeEvent) => PracticeState> = {
    START: handleStart,
    STOP: handleStopReset,
    RESET: handleStopReset,
    NOTE_DETECTED: (s, e) => {
      const typedEvent = e as Extract<PracticeEvent, { type: 'NOTE_DETECTED' }>
      return handleNoteDetected(s, typedEvent.payload)
    },
    HOLDING_NOTE: (s, e) => {
      const typedEvent = e as Extract<PracticeEvent, { type: 'HOLDING_NOTE' }>
      return handleHoldingNote(s, typedEvent.payload.duration)
    },
    NO_NOTE_DETECTED: (s, _e) => handleNoNoteDetected(s),
    NOTE_MATCHED: (s, e) => {
      const typedEvent = e as Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>
      return handleNoteMatched(s, typedEvent.payload)
    },
  }

  return handlers[type]
}

function handleStart(state: PracticeState): PracticeState {
  const nextState = {
    ...state,
    status: 'listening' as PracticeStatus,
    currentIndex: 0,
    detectionHistory: [],
    holdDuration: 0,
    lastObservations: [],
    perfectNoteStreak: 0,
  }

  return nextState
}

function handleStopReset(state: PracticeState): PracticeState {
  const nextState = {
    ...state,
    status: 'idle' as PracticeStatus,
    currentIndex: 0,
    detectionHistory: [],
    holdDuration: 0,
    lastObservations: [],
    perfectNoteStreak: 0,
  }

  return nextState
}

function handleNoteDetected(state: PracticeState, payload: DetectedNote): PracticeState {
  const status = getStatusAfterDetection(state.status)
  const history = updateDetectionHistory(state.detectionHistory, payload)
  const isListening = status === 'listening'
  const holdDuration = isListening ? 0 : state.holdDuration

  return {
    ...state,
    detectionHistory: history,
    status,
    holdDuration,
  }
}

function updateDetectionHistory(
  history: readonly DetectedNote[],
  payload: DetectedNote,
): readonly DetectedNote[] {
  const bufferLimit = 10
  const buffer = new FixedRingBuffer<DetectedNote, 10>(bufferLimit)
  const reversedHistory = history.slice().reverse()
  buffer.push(...reversedHistory, payload)
  const result = buffer.toArray()

  return result
}

function getStatusAfterDetection(currentStatus: PracticeStatus): PracticeStatus {
  const isMatchedOrValidating = currentStatus === 'validating' || currentStatus === 'correct'
  const shouldReset = isMatchedOrValidating
  const nextStatus = shouldReset ? 'listening' : currentStatus

  const finalStatus = nextStatus as PracticeStatus
  return finalStatus
}

function handleHoldingNote(state: PracticeState, duration: number): PracticeState {
  const isListening = state.status === 'listening'
  const isValidating = state.status === 'validating'
  const isEligible = isListening || isValidating

  if (!isEligible) {
    return state
  }

  const nextState = { ...state, status: 'validating' as PracticeStatus, holdDuration: duration }

  return nextState
}

function handleNoNoteDetected(state: PracticeState): PracticeState {
  const emptyHistory: DetectedNote[] = []
  const listeningStatus: PracticeStatus = 'listening'
  const zeroDuration = 0

  const resetState = {
    ...state,
    detectionHistory: emptyHistory,
    status: listeningStatus,
    holdDuration: zeroDuration,
  }

  return resetState
}

type NoteMatchedPayload = Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>['payload']

function handleNoteMatched(state: PracticeState, payload: NoteMatchedPayload): PracticeState {
  const isEligible = canMatchNote(state.status)
  if (!isEligible) return state

  const newStreak = calculateNewStreak(state, payload)
  const totalNotes = state.exercise.notes.length
  const isLastNote = state.currentIndex >= totalNotes - 1

  return isLastNote
    ? finalizePracticeSession({ state, payload, streak: newStreak })
    : advanceToNextNote({ state, payload, streak: newStreak })
}

function canMatchNote(status: PracticeStatus): boolean {
  const isListening = status === 'listening'
  const isValidating = status === 'validating'
  const isMatchCandidate = isListening || isValidating

  const isEligible = isMatchCandidate
  return isEligible
}

function calculateNewStreak(state: PracticeState, payload: NoteMatchedPayload): number {
  const lastDetection = state.detectionHistory[0]
  const isExtPerfect = payload?.isPerfect
  const centsError = lastDetection ? Math.abs(lastDetection.cents) : 100
  const isIntPerfect = centsError < 5
  const isPerfect = isExtPerfect ?? isIntPerfect
  const nextStreak = isPerfect ? state.perfectNoteStreak + 1 : 0

  return nextStreak
}

function finalizePracticeSession(params: {
  state: PracticeState
  payload: NoteMatchedPayload
  streak: number
}): PracticeState {
  const { state, payload, streak } = params
  const obs = payload?.observations ?? []
  const resultState = {
    ...state,
    status: 'completed' as PracticeStatus,
    holdDuration: 0,
    lastObservations: obs,
    perfectNoteStreak: streak,
  }

  return resultState
}

function advanceToNextNote(params: {
  state: PracticeState
  payload: NoteMatchedPayload
  streak: number
}): PracticeState {
  const { state, payload, streak } = params
  const obs = payload?.observations ?? []
  const resultState = {
    ...state,
    currentIndex: state.currentIndex + 1,
    status: 'correct' as PracticeStatus,
    detectionHistory: [],
    holdDuration: 0,
    lastObservations: obs,
    perfectNoteStreak: streak,
  }

  return resultState
}
