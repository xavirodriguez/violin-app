import { NoteTechnique } from '../lib/technique-types';
import { PracticeSession } from '@/lib/domain/practice-session';
/**
 * Internal state of the session store.
 *
 * @internal
 */
interface SessionState {
    /** The current active session data, or undefined if no session is active. */
    current: PracticeSession | undefined;
    /** Whether a session is currently being recorded. */
    isActive: boolean;
    /** Current streak of notes played with high accuracy (`< 5` cents). */
    perfectNoteStreak: number;
}
/**
 * Actions for managing practice sessions and recording real-time metrics.
 *
 * @public
 */
interface SessionActions {
    /**
     * Starts a new practice session recording.
     *
     * @remarks
     * Resets the `current` session state with initial metadata.
     *
     * @param exerciseId - Unique ID of the exercise.
     * @param exerciseName - Display name of the exercise.
     * @param mode - The session mode. Defaults to 'practice'.
     */
    start: (exerciseId: string, exerciseName: string, mode?: 'tuner' | 'practice') => void;
    /**
     * Ends the current session, calculates final metrics, and returns the data.
     *
     * @remarks
     * This method calculates the final accuracy and duration before clearing the active session.
     *
     * @returns The completed {@link PracticeSession} or undefined if no session was active.
     */
    end: () => PracticeSession | undefined;
    /**
     * Records a single attempt (audio frame) at a specific note.
     *
     * @remarks
     * This method updates the rolling average of cents deviation for the note using
     * the formula: `nextAvg = (currentAvg * count + newCents) / (count + 1)`.
     *
     * @param params - Parameters for the note attempt.
     */
    recordAttempt: (params: {
        noteIndex: number;
        pitch: string;
        cents: number;
        inTune: boolean;
    }) => void;
    /**
     * Records the successful completion of a note.
     *
     * @remarks
     * Updates the session progress and technical metrics.
     *
     * @param params - Parameters for the note completion.
     */
    recordCompletion: (params: {
        noteIndex: number;
        timeMs: number;
        technique?: NoteTechnique;
    }) => void;
}
/**
 * Zustand store for tracking real-time practice session metrics and history.
 *
 * @remarks
 * This store serves as a high-frequency accumulator for session data. It is
 * decoupled from the long-term `ProgressStore` and `AnalyticsStore` to ensure
 * that real-time updates don't trigger expensive persistence logic or
 * heavy recalculations on every audio frame.
 *
 * **Concurrency**: Updates are performed using Zustand's functional set state,
 * which is safe for high-frequency calls from the audio processing loop.
 *
 * **Metric Calculation**:
 * - Accuracy is calculated as the ratio of `notesCompleted` to `notesAttempted`.
 * - Average Cents uses a rolling mean to incorporate every detected frame.
 *
 * @public
 */
export declare const useSessionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionState & SessionActions>>;
export {};
