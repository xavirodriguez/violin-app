import { PracticeState } from '../practice-core'
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { Exercise } from '../exercises/types'
import { AppError } from '../errors/app-error'
import { PracticeSessionRunner } from './session-runner'

/**
 * Union type representing all possible states of the Practice Store.
 *
 * @remarks
 * Uses a Discriminated Union pattern to ensure type safety and eliminate
 * invalid states (e.g., an active session without a runner).
 *
 * @public
 */
export type PracticeStoreState =
  | IdleState
  | InitializingState
  | ReadyState
  | ActiveState
  | ErrorState

/**
 * Represents the initial state where no exercise is actively being practiced.
 */
export interface IdleState {
  /** The state machine status. */
  status: 'idle'
  /** The currently selected exercise, if any. */
  exercise: Exercise | null
  /** No error is present in this state. */
  error: null
}

/**
 * Represents the state while audio resources or exercises are being loaded.
 */
export interface InitializingState {
  /** The state machine status. */
  status: 'initializing'
  /** The exercise being initialized. */
  exercise: Exercise | null
  progress: number // 0-100
  error: null
}

/**
 * Represents the state when resources are loaded and the session is ready to start.
 */
export interface ReadyState {
  /** The state machine status. */
  status: 'ready'
  /** The initialized audio loop. */
  audioLoop: AudioLoopPort
  /** The initialized pitch detector. */
  detector: PitchDetectionPort
  /** The exercise ready to be played. */
  exercise: Exercise
  error: null
}

/**
 * Represents the state during an active practice session.
 */
export interface ActiveState {
  /** The state machine status. */
  status: 'active'
  /** The audio loop driving the session. */
  audioLoop: AudioLoopPort
  /** The pitch detector being used. */
  detector: PitchDetectionPort
  /** The exercise being practiced. */
  exercise: Exercise
  /** The runner instance managing the session lifecycle. */
  runner: PracticeSessionRunner
  /** The domain-specific practice state. */
  practiceState: PracticeState
  abortController: AbortController
  error: null
}

/**
 * Represents a state where a terminal or recoverable error has occurred.
 */
export interface ErrorState {
  /** The state machine status. */
  status: 'error'
  exercise: Exercise | null
  error: AppError
}

/**
 * Factory for valid state transitions in the practice system.
 *
 * @remarks
 * These functions enforce the rules of the state machine, ensuring that
 * state objects are always correctly shaped.
 *
 * @public
 */
export const transitions = {
  /**
   * Transitions to the initializing state.
   *
   * @param exercise - The exercise to initialize.
   */
  initialize: (exercise: Exercise | null): InitializingState => ({
    status: 'initializing',
    exercise,
    progress: 0,
    error: null,
  }),

  /**
   * Transitions to the ready state once resources are acquired.
   *
   * @param resources - The audio loop, detector, and exercise.
   */
  ready: (resources: {
    audioLoop: AudioLoopPort
    detector: PitchDetectionPort
    exercise: Exercise
  }): ReadyState => ({
    status: 'ready',
    ...resources,
    error: null,
  }),

  start: (
    state: ReadyState,
    runner: PracticeSessionRunner,
    abortController: AbortController,
  ): ActiveState => ({
    status: 'active',
    audioLoop: state.audioLoop,
    detector: state.detector,
    exercise: state.exercise,
    runner,
    abortController,
    error: null,
    practiceState: {
      status: 'listening',
      exercise: state.exercise,
      currentIndex: 0,
      detectionHistory: [],
      perfectNoteStreak: 0,
    },
  }),

  /**
   * Transitions back to idle from active or ready, stopping the runner and cleaning up resources.
   *
   * @param state - The current active or ready state.
   */
  stop: (state: ActiveState | ReadyState): IdleState => ({
    status: 'idle',
    exercise: state.exercise,
    error: null,
  }),

  
  /**
   * Transitions to the error state.
   *
   * @param error - The application error encountered.
   */
  error: (error: AppError, exercise: Exercise | null = null): ErrorState => ({
    status: 'error',
    exercise,
    error,
  }),

  /**
   * Resets the state machine to its initial idle state.
   */
  reset: (): IdleState => ({
    status: 'idle',
    exercise: null,
    error: null
  }),

  /**
   * Transitions to idle with a specific exercise selected.
   *
   * @param exercise - The exercise to select.
   */
  selectExercise: (exercise: Exercise): IdleState => ({
    status: 'idle',
    exercise,
    error: null
  })
}
