import { NoteTechnique, Observation } from '../technique-types'
import { Exercise, Note as TargetNote } from './exercise'

export type { TargetNote }
export type {
  NoteResult,
  PracticeSession,
  LivePracticeSession,
  CompletedPracticeSession,
  PersistedPracticeSession,
  NoteTechniqueSummary
} from './practice-session'

export { summarizeTechnique, toPersistedSession } from './practice-session'

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
  | { type: 'JUMP_TO_NOTE'; payload: { index: number } }
  | { type: 'NOTE_DETECTED'; payload: DetectedNote }
  | { type: 'HOLDING_NOTE'; payload: { duration: number } }
  | {
      type: 'NOTE_MATCHED'
      payload?: { technique: NoteTechnique; observations?: Observation[]; isPerfect?: boolean }
    }
  | { type: 'NO_NOTE_DETECTED' }

/**
 * Lifetime statistics for an individual exercise.
 */
export interface ExerciseStats {
  exerciseId: string
  timesCompleted: number
  bestAccuracy: number
  averageAccuracy: number
  fastestCompletionMs: number
  lastPracticedMs: number
}

/**
 * Represents a musical achievement or milestone earned by the user.
 */
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAtMs: number
}

/**
 * Defines the tolerance boundaries for matching a note.
 */
export interface MatchHysteresis {
  enter: number
  exit: number
}

/**
 * Events triggered by the UI to interact with the practice session.
 * @public
 */
export type PracticeUIEvent =
  | { type: 'START_SESSION' }
  | { type: 'STOP_SESSION' }
  | { type: 'RESET_SESSION' }
  | { type: 'TOGGLE_AUTO_START'; payload: { enabled: boolean } }
  | { type: 'JUMP_TO_NOTE'; payload: { index: number } }
  | { type: 'LOAD_EXERCISE'; payload: { exercise: Exercise } }

/**
 * Re-exporting pure functions from practice-core to domain for consolidation
 * while keeping practice-core as the implementation source.
 */
export { formatPitchName, isMatch, reducePracticeEvent } from '../practice-core'
export { MusicalNote, assertValidNoteName } from '../practice-core'
