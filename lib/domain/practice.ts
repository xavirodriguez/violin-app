import { Exercise, Note as TargetNote } from './exercise'
import { MetronomeConfig } from './audio'

export type { TargetNote, MetronomeConfig }
export type {
  NoteResult,
  PracticeSession,
  LivePracticeSession,
  CompletedPracticeSession,
  PersistedPracticeSession,
  NoteTechniqueSummary,
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
  perfectNoteStreak: number
  loopRegion?: LoopRegion
  metronome?: MetronomeConfig
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
      payload?: { isPerfect?: boolean }
    }
  | { type: 'NO_NOTE_DETECTED' }
  | { type: 'DRILL_ATTEMPT_COMPLETED'; payload: { success: boolean; precision: number } }
  | { type: 'UPDATE_METRONOME'; payload: Partial<MetronomeConfig> }
  | { type: 'UPDATE_LOOP_REGION'; payload: Partial<LoopRegion> }

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
 * Represents a region of the exercise selected for looping.
 */
export interface LoopRegion {
  startNoteIndex: number
  endNoteIndex: number
  isEnabled: boolean
  tempoMultiplier: number // 0.4 – 1.25
  drillTarget?: {
    precisionGoal: number // 0.70 | 0.80 | 0.90 | 0.95
    consecutiveRequired: number // 1 | 2 | 3
    currentStreak: number
  }
  history: AttemptResult[]
}

export interface AttemptResult {
  timestamp: number
  precision: number
  tempo: number
  notes: unknown[] // Result of notes in this attempt
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
  | { type: 'UPDATE_METRONOME'; payload: Partial<MetronomeConfig> }
  | { type: 'UPDATE_LOOP_REGION'; payload: Partial<LoopRegion> }

/**
 * Re-exporting pure functions from practice-core to domain for consolidation
 * while keeping practice-core as the implementation source.
 */
export { formatPitchName, isMatch, reducePracticeEvent } from '../practice-core'
export { MusicalNote, assertValidNoteName } from '../practice-core'
