import { PracticeState } from '../practice-core'
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { Exercise } from '../exercises/types'
import { AppError } from '../errors/app-error'
import { PracticeSessionRunner } from './session-runner'

/**
 * Union type representing all possible states of the Practice Store.
 *
 * @remarks
 * This state machine uses a Discriminated Union pattern (based on the `status` field)
 * to ensure type safety and eliminate invalid states (e.g., an active session without
 * an instantiated runner).
 *
 * **Workflow**:
 * 1. `idle`: Application is waiting for an exercise to be selected.
 * 2. `initializing`: Hardware resources (microphone) are being acquired.
 * 3. `ready`: Hardware is ready; waiting for user to press "Start".
 * 4. `active`: Practice session is running; audio is being processed.
 * 5. `error`: A terminal error occurred (e.g., mic access denied).
 *
 * **State Flow**:
 * `idle` -\> `initializing` -\> `ready` -\> `active` -\> `idle` (or `error`)
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
 *
 * @public
 */
export interface IdleState {
  /** The state machine status identifier. */
  status: 'idle'
  /** The currently selected exercise, if any. */
  exercise: Exercise | undefined
  /** No error is present in this state. */
  error: undefined
}

/**
 * Represents the state while audio resources or exercises are being loaded.
 *
 * @remarks
 * Transitions to `ReadyState` upon success or `ErrorState` upon failure.
 *
 * @public
 */
export interface InitializingState {
  /** The state machine status identifier. */
  status: 'initializing'
  /** The exercise being initialized. */
  exercise: Exercise | undefined
  /**
   * Progress percentage of the initialization (0-100).
   * Currently unused but reserved for long-running resource downloads.
   */
  progress: number
  /** No error is present while initializing. */
  error: undefined
}

/**
 * Represents the state when resources are loaded and the session is ready to start.
 *
 * @remarks
 * In this state, the microphone has been acquired and the pitch detector is ready,
 * but the real-time processing loop has not yet started.
 *
 * @public
 */
export interface ReadyState {
  /** The state machine status identifier. */
  status: 'ready'
  /** The initialized audio loop port, ready to be started. */
  audioLoop: AudioLoopPort
  /** The initialized pitch detector port. */
  detector: PitchDetectionPort
  /** The exercise ready to be played. */
  exercise: Exercise
  /** No error is present in ready state. */
  error: undefined
}

/**
 * Represents the state during an active practice session.
 *
 * @remarks
 * This is the "hot" state where the audio pipeline is actively consuming frames.
 *
 * **Lifecycle Management**:
 * - The `runner` is responsible for orchestrating the audio/domain loop.
 * - The `abortController` allows for clean termination and resource release.
 * - `practiceState` holds the real-time progress (current note, history).
 *
 * @public
 */
export interface ActiveState {
  /** The state machine status identifier. */
  status: 'active'
  /** The audio loop driving the session. */
  audioLoop: AudioLoopPort
  /** The pitch detector being used for analysis. */
  detector: PitchDetectionPort
  /** The exercise currently being practiced. */
  exercise: Exercise
  /** The runner instance managing the session orchestration. */
  runner: PracticeSessionRunner
  /** The domain-specific practice progress state. */
  practiceState: PracticeState
  /** Controller used to signal cancellation of the session and the underlying pipeline. */
  abortController: AbortController
  /** No error is present while active. */
  error: undefined
}

/**
 * Represents a state where a terminal or recoverable error has occurred.
 *
 * @remarks
 * Recoverable errors (like hardware disconnects) can transition back to `idle`
 * via a reset or retry operation.
 *
 * @public
 */
export interface ErrorState {
  /** The state machine status identifier. */
  status: 'error'
  /** The exercise that was being used when the error occurred. */
  exercise: Exercise | undefined
  /** Detailed error information, conforming to the application error standard. */
  error: AppError
}

/**
 * Factory for valid state transitions in the practice system.
 *
 * @remarks
 * These functions enforce the formal invariants of the Finite State Machine (FSM).
 * They ensure that state objects are always correctly shaped and that transitions
 * follow the intended business logic, preventing "impossible" states (e.g.,
 * being `active` without a `runner`).
 *
 * **Immutability**: Every transition returns a new state object, following
 * the principles of functional programming and ensuring compatibility with
 * reactive stores like Zustand.
 *
 * @public
 */
export const transitions = {
  /**
   * Transitions the system to the initializing state.
   */
  initialize: (exercise: Exercise | undefined): InitializingState => ({
    status: 'initializing',
    exercise,
    progress: 0,
    error: undefined,
  }),

  /**
   * Transitions to the ready state once resources (microphone, detector) are acquired.
   */
  ready: (resources: {
    audioLoop: AudioLoopPort
    detector: PitchDetectionPort
    exercise: Exercise
  }): ReadyState => ({
    status: 'ready',
    ...resources,
    error: undefined,
  }),

  /**
   * Transitions from ready to active, commencing the session execution.
   */
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
    error: undefined,
    practiceState: {
      status: 'listening',
      exercise: state.exercise,
      currentIndex: 0,
      detectionHistory: [],
      perfectNoteStreak: 0,
    },
  }),

  /**
   * Transitions back to idle from active or ready, performing a graceful stop.
   */
  stop: (state: ActiveState | ReadyState): IdleState => ({
    status: 'idle',
    exercise: state.exercise,
    error: undefined,
  }),

  /**
   * Transitions to the error state due to a failure in initialization or execution.
   */
  error: (error: AppError, exercise: Exercise | undefined = undefined): ErrorState => ({
    status: 'error',
    exercise,
    error,
  }),

  /**
   * Resets the state machine to its absolute initial state, clearing all context.
   */
  reset: (): IdleState => ({
    status: 'idle',
    exercise: undefined,
    error: undefined
  }),

  /**
   * Transitions to idle while selecting a specific exercise for future practice.
   */
  selectExercise: (exercise: Exercise): IdleState => ({
    status: 'idle',
    exercise,
    error: undefined
  })
}
