import { PracticeState } from '../practice-core';
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import { Exercise } from '../exercises/types';
import { AppError } from '../errors/app-error';
import { PracticeSessionRunner } from './session-runner';
/**
 * Union type representing all possible states of the Practice Store.
 *
 * @remarks
 * Uses a Discriminated Union pattern (based on the `status` field) to ensure
 * type safety and eliminate invalid states (e.g., an active session without a runner).
 * This FSM (Finite State Machine) governs the high-level lifecycle of the practice experience.
 *
 * @public
 */
export type PracticeStoreState = IdleState | InitializingState | ReadyState | ActiveState | ErrorState;
/**
 * Represents the initial state where no exercise is actively being practiced.
 *
 * @public
 */
export interface IdleState {
    /** The state machine status. */
    status: 'idle';
    /** The currently selected exercise, if any. */
    exercise: Exercise | null;
    /** No error is present in this state. */
    error: null;
}
/**
 * Represents the state while audio resources or exercises are being loaded.
 *
 * @public
 */
export interface InitializingState {
    /** The state machine status. */
    status: 'initializing';
    /** The exercise being initialized. */
    exercise: Exercise | null;
    /** Progress percentage of the initialization (0-100). */
    progress: number;
    /** No error is present while initializing. */
    error: null;
}
/**
 * Represents the state when resources are loaded and the session is ready to start.
 *
 * @public
 */
export interface ReadyState {
    /** The state machine status. */
    status: 'ready';
    /** The initialized audio loop port. */
    audioLoop: AudioLoopPort;
    /** The initialized pitch detector port. */
    detector: PitchDetectionPort;
    /** The exercise ready to be played. */
    exercise: Exercise;
    /** No error is present in ready state. */
    error: null;
}
/**
 * Represents the state during an active practice session.
 *
 * @remarks
 * In this state, the audio pipeline is running and events are being processed.
 *
 * @public
 */
export interface ActiveState {
    /** The state machine status. */
    status: 'active';
    /** The audio loop driving the session. */
    audioLoop: AudioLoopPort;
    /** The pitch detector being used for analysis. */
    detector: PitchDetectionPort;
    /** The exercise currently being practiced. */
    exercise: Exercise;
    /** The runner instance managing the session orchestration. */
    runner: PracticeSessionRunner;
    /** The domain-specific practice progress state. */
    practiceState: PracticeState;
    /** Controller used to signal cancellation of the session. */
    abortController: AbortController;
    /** No error is present while active. */
    error: null;
}
/**
 * Represents a state where a terminal or recoverable error has occurred.
 *
 * @public
 */
export interface ErrorState {
    /** The state machine status. */
    status: 'error';
    /** The exercise that was being used when the error occurred. */
    exercise: Exercise | null;
    /** Detailed error information. */
    error: AppError;
}
/**
 * Factory for valid state transitions in the practice system.
 *
 * @remarks
 * These functions enforce the business rules of the state machine, ensuring
 * that state objects are always correctly shaped and that transitions follow
 * the intended logic.
 *
 * @public
 */
export declare const transitions: {
    /**
     * Transitions to the initializing state.
     *
     * @param exercise - The exercise to initialize.
     * @returns A new {@link InitializingState}.
     */
    initialize: (exercise: Exercise | null) => InitializingState;
    /**
     * Transitions to the ready state once resources (microphone, detector) are acquired.
     *
     * @param resources - The audio loop, detector, and exercise.
     * @returns A new {@link ReadyState}.
     */
    ready: (resources: {
        audioLoop: AudioLoopPort;
        detector: PitchDetectionPort;
        exercise: Exercise;
    }) => ReadyState;
    /**
     * Transitions from ready to active, starting the session execution.
     *
     * @param state - The current ready state.
     * @param runner - The session runner implementation.
     * @param abortController - The controller for the new session.
     * @returns A new {@link ActiveState}.
     */
    start: (state: ReadyState, runner: PracticeSessionRunner, abortController: AbortController) => ActiveState;
    /**
     * Transitions back to idle from active or ready, stopping the session.
     *
     * @param state - The current active or ready state.
     * @returns A new {@link IdleState} with the same exercise selected.
     */
    stop: (state: ActiveState | ReadyState) => IdleState;
    /**
     * Transitions to the error state.
     *
     * @param error - The application error encountered.
     * @param exercise - The exercise currently in use.
     * @returns A new {@link ErrorState}.
     */
    error: (error: AppError, exercise?: Exercise | null) => ErrorState;
    /**
     * Resets the state machine to its absolute initial state.
     *
     * @returns A new {@link IdleState} with no exercise.
     */
    reset: () => IdleState;
    /**
     * Transitions to idle while selecting a specific exercise.
     *
     * @param exercise - The exercise to select.
     * @returns A new {@link IdleState}.
     */
    selectExercise: (exercise: Exercise) => IdleState;
};
