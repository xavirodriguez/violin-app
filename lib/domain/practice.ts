import { NoteTechnique, Observation } from '../technique-types'
import { Exercise } from './exercise'

/**
 * Summary of technical performance for a note, focused on MVP priorities.
 */
export interface NoteTechniqueSummary {
  pitchStability: {
    settlingStdCents: number
    globalStdCents: number
  }
  resonance: {
    rmsBeatingScore: number
  }
  attackRelease?: {
    attackTimeMs: number
  }
  rhythm?: {
    onsetErrorMs: number
  }
}

/**
 * Result of practicing a single note.
 *
 * @remarks
 * This model tracks the performance metrics for an individual note within a session,
 * including intonation accuracy and technical execution. It supports both in-progress
 * tracking and final summary.
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
  /** Full technique data if available, or summary for persistence. */
  technique?: NoteTechnique | NoteTechniqueSummary
}

/**
 * Canonical model for a practice session result.
 *
 * @remarks
 * This is the primary data structure for persistent history. It aggregates all
 * note-level results into a session summary used for analytics and skill calculation.
 *
 * @public
 */
export interface PracticeResult {
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

/** Legacy alias to be phased out */
export type PracticeSession = PracticeResult

/**
 * Lifetime statistics for an individual exercise.
 *
 * @remarks
 * Aggregates performance data across multiple attempts of the same exercise
 * to track student improvement over time.
 *
 * @public
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
