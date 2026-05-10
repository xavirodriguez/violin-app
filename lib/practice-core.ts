/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 */

import { normalizeAccidental } from './domain/musical-domain'
import { AppError, ERROR_CODES } from './errors/app-error'
import type { Note as TargetNote } from '@/lib/domain/exercise'
import type {
  DetectedNote,
  PracticeStatus,
  PracticeState,
  PracticeEvent,
  MatchHysteresis,
} from '@/lib/domain/practice'

export type {
  TargetNote,
  DetectedNote,
  PracticeStatus,
  PracticeState,
  PracticeEvent,
  MatchHysteresis,
}

export type NoteName = string & { readonly __brand: unique symbol }

export function assertValidNoteName(name: string): asserts name is NoteName {
  const noteRegex = /^[A-G](?:b{1,2}|#{1,2})?[0-8]$/
  const isValid = noteRegex.test(name)

  if (!isValid) {
    const message = `Invalid note name format: "${name}"`
    throw new AppError({
      message,
      code: ERROR_CODES.NOTE_PARSING_FAILED,
    })
  }
}

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
    const interval = (midiNumber - A4_MIDI) / 12
    const frequency = A4_FREQUENCY * Math.pow(2, interval)
    return MusicalNote.fromFrequency(frequency)
  }

  static fromName(fullName: NoteName): MusicalNote {
    const match = (fullName as string).match(/^([A-G])(b{1,2}|#{1,2})?([0-8])$/)
    if (!match) {
      throw new AppError({
        message: `Invalid note name format: "${fullName}"`,
        code: ERROR_CODES.NOTE_PARSING_FAILED,
      })
    }
    const [, step, accidental = '', octaveStr] = match
    const stepValue = STEP_VALUES[step]
    const accidentalValue = ACCIDENTAL_MODIFIERS[accidental]
    const midiNumber = (parseInt(octaveStr, 10) + 1) * 12 + stepValue + accidentalValue
    return MusicalNote.fromMidi(midiNumber)
  }

  get nameWithOctave(): NoteName {
    return `${this.noteName}${this.octave}` as NoteName
  }
}

export function formatPitchName(pitch: TargetNote['pitch']): NoteName {
  const canonicalAlter = normalizeAccidental(pitch.alter)
  const alterStr = canonicalAlter === 1 ? '#' : canonicalAlter === -1 ? 'b' : ''
  return `${pitch.step}${alterStr}${pitch.octave}` as NoteName
}

export function isMatch(params: {
  target: TargetNote | undefined
  detected: DetectedNote | undefined
  tolerance?: number | MatchHysteresis
  matchStatus?: 'initial' | 'maintaining'
}): boolean {
  const { target, detected, tolerance = 25, matchStatus = 'initial' } = params
  if (!target || !detected) return false

  const hysteresis = typeof tolerance === 'number' ? { enter: tolerance, exit: tolerance } : tolerance
  const actualTolerance = matchStatus === 'maintaining' ? hysteresis.exit : hysteresis.enter

  const targetNote = MusicalNote.fromName(formatPitchName(target.pitch))
  const detectedNote = MusicalNote.fromName(detected.pitch as NoteName)

  return targetNote.isEnharmonic(detectedNote) && Math.abs(detected.cents) < actualTolerance
}

export function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState {
  switch (event.type) {
    case 'START':
      return { ...state, status: 'listening', currentIndex: 0, detectionHistory: [], holdDuration: 0 }
    case 'STOP':
    case 'RESET':
      return { ...state, status: 'idle', currentIndex: 0, detectionHistory: [], holdDuration: 0 }
    case 'NOTE_DETECTED':
      return { ...state, detectionHistory: [event.payload, ...state.detectionHistory].slice(0, 10) }
    case 'HOLDING_NOTE':
      return { ...state, status: 'validating', holdDuration: event.payload.duration }
    case 'NO_NOTE_DETECTED':
      return { ...state, status: state.status === 'validating' ? 'listening' : state.status, holdDuration: 0 }
    case 'NOTE_MATCHED':
      const isLastNote = state.currentIndex >= state.exercise.notes.length - 1
      return {
        ...state,
        currentIndex: isLastNote ? state.currentIndex : state.currentIndex + 1,
        status: isLastNote ? 'completed' : 'correct',
        detectionHistory: [],
        holdDuration: 0,
      }
    default:
      return state
  }
}
