/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing the lifecycle from exercise
 * selection to completion. It coordinates audio resources, real-time analysis,
 * and persistent progress tracking.
 */
import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
import { AppError } from '@/lib/errors/app-error';
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port';
import { PracticeStoreState } from '@/lib/practice/practice-states';
import type { Exercise } from '@/lib/exercises/types';
import { Observation } from '@/lib/technique-types';
/**
 * Main store for managing the practice mode lifecycle and real-time audio pipeline.
 *
 * @remarks
 * This store is the central hub for the practice experience, coordinating:
 * 1. **Audio Infrastructure**: Manages Web Audio context, analysers, and microphone access.
 * 2. **State Orchestration**: Uses a formalized FSM (`PracticeStoreState`) to ensure valid transitions.
 * 3. **High-Frequency Analysis**: Consumes events from the audio pipeline and updates the UI state.
 * 4. **Telemetry & Analytics**: Synchronizes session data with `SessionStore` and `ProgressStore`.
 *
 * It implements a `sessionToken` pattern (UUID) to guard against race conditions during
 * asynchronous state updates in real-time loops.
 *
 * @public
 */
interface PracticeStore {
    /**
     * The current formalized state of the practice system (FSM).
     */
    state: PracticeStoreState;
    /**
     * Domain-specific practice state (backward compatibility).
     * @deprecated Use `state.practiceState` when in 'active' status.
     */
    practiceState: PracticeState | null;
    /**
     * Most recent error encountered during initialization or execution.
     */
    error: AppError | null;
    /**
     * Real-time observations about the user's playing (intonation, stability, etc.).
     */
    liveObservations: Observation[];
    /**
     * Whether the practice session should start automatically after loading an exercise.
     */
    autoStartEnabled: boolean;
    /**
     * The Web Audio AnalyserNode used for visualization.
     */
    analyser: AnalyserNode | null;
    /**
     * The loop driver responsible for pulling audio frames from the hardware.
     */
    audioLoop: AudioLoopPort | null;
    /**
     * The active pitch detection engine instance.
     */
    detector: PitchDetectionPort | null;
    /**
     * Flag indicating if a start operation is currently in progress.
     */
    isStarting: boolean;
    /**
     * Flag indicating if the audio hardware is being initialized.
     */
    isInitializing: boolean;
    /**
     * Unique identifier for the current active session to prevent stale updates.
     */
    sessionToken: string | null;
    /**
     * Loads an exercise into the store and prepares for practice.
     *
     * @param exercise - The musical exercise to load.
     * @returns A promise that resolves when the exercise is loaded and the store is reset.
     */
    loadExercise: (exercise: Exercise) => Promise<void>;
    /**
     * Enables or disables automatic start of the practice session.
     *
     * @param enabled - True to enable auto-start.
     */
    setAutoStart: (enabled: boolean) => void;
    /**
     * Manually sets the current note index in the exercise.
     *
     * @param index - The index of the note to jump to.
     */
    setNoteIndex: (index: number) => void;
    /**
     * Initializes the audio hardware and acquires microphone permissions.
     *
     * @remarks
     * This method is retriable from 'idle' or 'error' states. It coordinates with the
     * `audioManager` and creates the necessary port adapters.
     *
     * @returns A promise that resolves when audio is successfully initialized.
     * @throws {@link AppError} if microphone access is denied.
     */
    initializeAudio: () => Promise<void>;
    /**
     * Begins the active practice session.
     *
     * @remarks
     * This method:
     * 1. Ensures audio is initialized.
     * 2. Generates a new `sessionToken`.
     * 3. Instantiates the `PracticeSessionRunnerImpl`.
     * 4. Starts the analytics session.
     * 5. Commences the asynchronous audio processing loop.
     *
     * @returns A promise that resolves when the session has started.
     */
    start: () => Promise<void>;
    /**
     * Stops the current practice session and releases all audio/hardware resources.
     *
     * @remarks
     * This method is idempotent and performs a "resource-first" cleanup:
     * 1. Aborts the runner and loop.
     * 2. Closes the audio manager.
     * 3. Finalizes the analytics session.
     *
     * @returns A promise that resolves when cleanup is complete.
     */
    stop: () => Promise<void>;
    /**
     * Completely resets the store, stopping any active sessions and clearing the selected exercise.
     *
     * @returns A promise that resolves when reset is complete.
     */
    reset: () => Promise<void>;
    /**
     * Consumes a stream of events from the practice pipeline and updates the store state.
     *
     * @remarks
     * This is a high-frequency internal method that bridge the async generator pipeline
     * with the reactive store. It uses `sessionToken` to ensure updates belong to the current session.
     *
     * @param pipeline - An async iterable of practice events.
     * @returns A promise that resolves when the pipeline is closed.
     * @internal
     */
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
}
/**
 * Implementation of the PracticeStore using Zustand.
 *
 * @public
 */
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
export {};
