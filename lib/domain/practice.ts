import { NoteTechnique, Observation } from '../technique-types'
import { Exercise, Note as TargetNote } from './exercise'

export type { TargetNote }

/**
 * Represents a note detected from the user's microphone input.
 *
 * @public
 */
export interface DetectedNote {
  pitch: string
  pitchHz: number
  cents: number
  timestamp: number
  confidence: number
}

/**
 * The status of the practice session.
 *
 * @public
 */
export type PracticeStatus = 'idle' | 'listening' | 'validating' | 'correct' | 'completed'

/**
 * The complete, self-contained state of the practice session.
 *
 * @public
 */
export interface PracticeState {
  status: PracticeStatus
  exercise: Exercise
  currentIndex: number
  detectionHistory: readonly DetectedNote[]
  holdDuration?: number
  lastObservations?: Observation[]
  perfectNoteStreak: number
}

/**
 * Events that can modify the practice state.
 *
 * @public
 */
export type PracticeEvent =
  | { type: 'START'; payload?: { startIndex?: number } }
  | { type: 'STOP' }
  | { type: 'RESET' }
  | { type: 'NOTE_DETECTED'; payload: DetectedNote }
  | { type: 'HOLDING_NOTE'; payload: { duration: number } }
  | {
      type: 'NOTE_MATCHED'
      payload?: { technique: NoteTechnique; observations?: Observation[]; isPerfect?: boolean }
    }
  | { type: 'NO_NOTE_DETECTED' }

/**
 * Result of practicing a single note.
 * Can represent a note in progress or a completed one.
 *
 * @public
 */
export interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  /** Optional because it's only available once the note is completed. */
  timeToCompleteMs?: number
  averageCents: number
  wasInTune: boolean
  /** Full technique data if available. */
  technique?: NoteTechnique
}

/**
 * Canonical model for a practice session.
 * Used for live tracking, analytics, and persistence.
 *
 * @public
 */
export interface PracticeSession {
  id: string
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  exerciseId: string
  exerciseName: string
  mode: 'tuner' | 'practice'
  noteResults: NoteResult[]
  notesAttempted: number
  notesCompleted: number
  accuracy: number
  averageCents: number
}

/**
 * Defines the tolerance boundaries for matching a note.
 */
export interface MatchHysteresis {
  enter: number
  exit: number
}

/**
 * Re-exporting pure functions from practice-core to domain for consolidation
 * while keeping practice-core as the implementation source.
 */
export { formatPitchName, isMatch, reducePracticeEvent } from '../practice-core'
export { MusicalNote, assertValidNoteName } from '../practice-core'
