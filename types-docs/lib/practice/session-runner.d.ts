import { type PracticeState, type PracticeEvent } from '@/lib/domain/practice';
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import type { Exercise } from '@/lib/domain/exercise';
import { NoteTechnique, Observation } from '../technique-types';
/**
 * Result of a completed or cancelled practice session runner execution.
 *
 * @public
 */
export interface SessionResult {
    completed: boolean;
    reason: 'finished' | 'cancelled' | 'error';
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
 * Minimal store interface for state management and UI synchronization.
 * @internal
 */
export interface RunnerStore {
    getState: () => {
        practiceState: PracticeState | undefined;
        liveObservations?: Observation[];
    };
    dispatch: (event: PracticeEvent) => void;
    stop: () => Promise<void>;
}
/**
 * Analytics handlers for recording performance metrics.
 * @internal
 */
export interface RunnerAnalytics {
    endSession: () => void;
    recordNoteAttempt: (params: {
        index: number;
        pitch: string;
        cents: number;
        inTune: boolean;
    }) => void;
    recordNoteCompletion: (params: {
        index: number;
        time: number;
        technique?: NoteTechnique;
    }) => void;
}
/**
 * Dependencies required by the {@link PracticeSessionRunnerImpl}.
 *
 * @public
 */
export interface SessionRunnerDependencies {
    audioLoop: AudioLoopPort;
    detector: PitchDetectionPort;
    exercise: Exercise;
    sessionStartTime: number;
    store: RunnerStore;
    analytics: RunnerAnalytics;
    updatePitch?: (pitch: number, confidence: number) => void;
    centsTolerance?: number;
    bpm?: number;
    loopRegion?: import('@/lib/domain/practice').LoopRegion;
    minRms?: number;
}
/**
 * Implementation of {@link PracticeSessionRunner} that orchestrates the Practice Engine.
 *
 * @remarks
 * This class serves as the operational bridge between the high-frequency Practice Engine
 * and the reactive UI stores. It is responsible for:
 * 1. **Lifecycle Management**: Handling the startup, cancellation, and error states of a session.
 * 2. **Dependency Injection**: Providing audio ports and analytics handlers to the engine.
 * 3. **State Synchronization**: Dispatching engine events to the `PracticeStore` and `TunerStore`.
 * 4. **Telemetry**: Logging accuracy data when specific feature flags are enabled.
 *
 * @public
 */
export declare class PracticeSessionRunnerImpl implements PracticeSessionRunner {
    private abortController;
    private sessionStats;
    private environment;
    constructor(environment: SessionRunnerDependencies);
    run(externalSignal: AbortSignal): Promise<SessionResult>;
    private executeSession;
    cancel(): void;
    private determineResult;
    private handleRunError;
    private executeLoop;
    private initializeEngine;
    private processEngineEvent;
    private mapToLegacyEvent;
    private dispatchInternalEvent;
    private handleEventOutcome;
    private synchronizeFeedback;
    private clearFeedback;
    private handleEventCompletion;
    private propagateToEventSink;
    private logTelemetry;
    private recordNoteMilestone;
    private emitAnalytics;
    private updateRunnerStats;
}
/**
 * @deprecated Use `PracticeSessionRunnerImpl` directly.
 */
export declare function runPracticeSession(deps: SessionRunnerDependencies): Promise<SessionResult>;
