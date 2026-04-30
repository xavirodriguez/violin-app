import { NoteTechnique, Observation } from '../technique-types'
import { Exercise } from './exercise'
import {
  NoteTechniqueSummary,
  NoteResult,
  LivePracticeSession,
  CompletedPracticeSession,
  PracticeSession,
  toPersistedSession
} from './practice-session'

export type {
  NoteTechniqueSummary,
  NoteResult,
  LivePracticeSession,
  CompletedPracticeSession,
  PracticeSession
}

export { toPersistedSession }

/**
 * Canonical model for a practice session result.
 * @deprecated Use CompletedPracticeSession or PracticeSession from ./practice-session
 */
export type PracticeResult = CompletedPracticeSession

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
