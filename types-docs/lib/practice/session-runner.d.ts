import { type PracticeState } from '@/lib/practice-core';
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import type { Exercise } from '@/lib/exercises/types';
import { NoteTechnique } from '../technique-types';
import { Observation } from '../technique-types';
/**
 * Result of a completed or cancelled practice session runner execution.
 *
 * @public
 */
export interface SessionResult {
    /** Whether the session finished naturally (reached the end of the exercise). */
    completed: boolean;
    /** The reason why the session ended. */
    reason: 'finished' | 'cancelled' | 'error';
    /** The error object if the session ended due to an error. */
    error?: Error;
}
/**
 * Interface for the practice session runner, responsible for coordinating the audio
 * loop, pitch detection, and state updates during a session.
 *
 * @public
 */
export interface PracticeSessionRunner {
    /**
     * Starts the practice session and runs until completion, cancellation, or error.
     *
     * @param signal - An external {@link AbortSignal} to cancel the session.
     * @returns A promise that resolves with the {@link SessionResult}.
     */
    run(signal: AbortSignal): Promise<SessionResult>;
    /**
     * Immediately stops the running session.
     */
    cancel(): void;
}
/**
 * Dependencies required by the {@link PracticeSessionRunnerImpl}.
 */
interface SessionRunnerDependencies {
    /** The source of audio frames (Hardware/Web Audio). */
    audioLoop: AudioLoopPort;
    /** The pitch detector instance for real-time analysis. */
    detector: PitchDetectionPort;
    /** The musical exercise to be practiced. */
    exercise: Exercise;
    /** Unix timestamp of when the session was initiated. */
    sessionStartTime: number;
    /** Minimal store interface for state management and UI synchronization. */
    store: {
        /** Retrieves the current domain and UI observation state. */
        getState: () => {
            practiceState: PracticeState | null;
            liveObservations?: Observation[];
        };
        /** Updates the store state using functional updaters. */
        setState: (partial: {
            practiceState: PracticeState | null;
            liveObservations?: Observation[];
        } | Partial<{
            practiceState: PracticeState | null;
            liveObservations?: Observation[];
        }> | ((state: {
            practiceState: PracticeState | null;
            liveObservations?: Observation[];
        }) => {
            practiceState: PracticeState | null;
            liveObservations?: Observation[];
        } | Partial<{
            practiceState: PracticeState | null;
            liveObservations?: Observation[];
        }>), replace?: boolean) => void;
        /** Stops the session and cleans up resources. */
        stop: () => Promise<void>;
    };
    /** Analytics handlers for recording performance metrics. */
    analytics: {
        /** Ends the analytics session and finalizes data. */
        endSession: () => void;
        /** Records an individual pitch detection attempt. */
        recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void;
        /** Records the successful completion/matching of a note. */
        recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void;
    };
    /** Optional callback to update real-time pitch feedback (e.g., for a visual tuner). */
    updatePitch?: (pitch: number, confidence: number) => void;
}
/**
 * Implementation of {@link PracticeSessionRunner} that orchestrates the Practice Engine
 * and synchronizes with the application stores.
 *
 * @remarks
 * This class acts as the "glue" between the pure domain logic of the `PracticeEngine`
 * and the external world. It manages:
 * 1. **Loop Orchestration**: Consumes engine events using an async iterator.
 * 2. **State Synchronization**: Maps domain events to store updates via `handlePracticeEvent`.
 * 3. **Side Effects**: Triggers analytics, telemetry, and pitch feedback.
 * 4. **Lifecycle Management**: Handles graceful cancellation via {@link AbortController}.
 *
 * @public
 */
export declare class PracticeSessionRunnerImpl implements PracticeSessionRunner {
    private deps;
    private controller;
    private loopState;
    /**
     * Creates an instance of PracticeSessionRunnerImpl.
     *
     * @param deps - The dependencies required for session orchestration.
     */
    constructor(deps: SessionRunnerDependencies);
    /**
     * Executes the session loop until completion, error, or external cancellation.
     *
     * @param signal - External abort signal.
     * @returns The session outcome result.
     */
    run(signal: AbortSignal): Promise<SessionResult>;
    /**
     * Cancels the current execution and triggers internal cleanup.
     */
    cancel(): void;
    /**
     * Performs internal cleanup of session-specific resources.
     * @internal
     */
    private cleanup;
    /**
     * Internal async loop that consumes event streams from the Practice Engine.
     *
     * @param signal - Abort signal for the loop.
     */
    private runInternal;
    /**
     * Maps formalized engine events to legacy domain events.
     * @internal
     */
    private mapEngineEventToPracticeEvent;
    /**
     * Processes a single practice event, updating state and triggering side effects.
     *
     * @param event - The event to process.
     * @param signal - Current session signal.
     * @internal
     */
    private processEvent;
    /**
     * Handles side effects specific to matching a note, such as recording analytics.
     * @internal
     */
    private handleMatchedNoteSideEffects;
}
/**
 * Runs a practice session using the provided dependencies.
 *
 * @deprecated Use `PracticeSessionRunnerImpl` directly for better lifecycle management.
 *
 * @param deps - Session dependencies.
 * @returns A promise with the session result.
 * @public
 */
export declare function runPracticeSession(deps: SessionRunnerDependencies): Promise<SessionResult>;
export {};
