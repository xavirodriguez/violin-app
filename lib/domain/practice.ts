import { NoteTechnique, Observation } from '../technique-types'
<<<<<<< HEAD
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
=======
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
 * Can represent a note in progress or a completed one.
>>>>>>> main
 */
export interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  /** Optional because it's only available once the note is completed. */
  timeToCompleteMs?: number
  averageCents: number
  wasInTune: boolean
<<<<<<< HEAD
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
=======
  /** Full technique data if available, or summary for persistence. */
  technique?: NoteTechnique | NoteTechniqueSummary
}

/**
 * Canonical model for a practice session result.
 * Used for live tracking, analytics, and persistence.
 */
export interface PracticeResult {
>>>>>>> main
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

<<<<<<< HEAD
=======
/** Legacy alias to be phased out */
export type PracticeSession = PracticeResult

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

>>>>>>> main
/**
 * Defines the tolerance boundaries for matching a note.
 */
export interface MatchHysteresis {
  enter: number
  exit: number
}

<<<<<<< HEAD
/**
 * Re-exporting pure functions from practice-core to domain for consolidation
 * while keeping practice-core as the implementation source.
 */
export { formatPitchName, isMatch, reducePracticeEvent } from '../practice-core'
export { MusicalNote, assertValidNoteName } from '../practice-core'
=======
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
>>>>>>> main
