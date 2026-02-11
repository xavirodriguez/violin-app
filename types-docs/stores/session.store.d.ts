import { NoteTechnique } from '../lib/technique-types';
/**
 * Result of practicing a single note within a session.
 *
 * @remarks
 * This model tracks the cumulative performance of a user on a specific note,
 * including accuracy and timing metrics.
 *
 * @public
 */
export interface NoteResult {
    /** The index of the note in the exercise. */
    noteIndex: number;
    /** The target scientific pitch name (e.g., "A4"). */
    targetPitch: string;
    /** Total number of attempts/frames processed for this note. */
    attempts: number;
    /** Time taken to successfully complete the note, in milliseconds. */
    timeToCompleteMs?: number;
    /** Average pitch deviation in cents from the target. */
    averageCents: number;
    /** Whether the note was eventually played correctly in tune. */
    wasInTune: boolean;
    /** Detected technical details (e.g., rhythm, attack), if available. */
    technique?: NoteTechnique;
}
/**
 * Data model for a completed or active practice session.
 *
 * @remarks
 * Encapsulates all metadata and metrics for a discrete practice event.
 *
 * @public
 */
export interface PracticeSession {
    /** Unique session identifier, typically prefixed with `session_`. */
    id: string;
    /** Unix timestamp when the session started. */
    startTimeMs: number;
    /** Unix timestamp when the session ended. */
    endTimeMs: number;
    /** Total session duration in milliseconds. */
    durationMs: number;
    /** Identifier of the exercise practiced. */
    exerciseId: string;
    /** Human-readable name of the exercise. */
    exerciseName: string;
    /** The mode in which the session was conducted. */
    mode: 'tuner' | 'practice';
    /** Individual results for each note in the exercise. */
    noteResults: NoteResult[];
    /** Total number of note attempts (audio frames matched) across the whole session. */
    notesAttempted: number;
    /** Total number of notes successfully completed/mastered. */
    notesCompleted: number;
    /** Overall accuracy percentage (0-100). */
    accuracy: number;
    /** Overall average pitch deviation in cents across all attempts. */
    averageCents: number;
}
/**
 * Internal state of the session store.
 */
interface SessionState {
    /** The current active session data, or null if no session is active. */
    current: PracticeSession | null;
    /** Whether a session is currently being recorded. */
    isActive: boolean;
    /** Current streak of notes played with high accuracy (`< 5` cents). */
    perfectNoteStreak: number;
}
/**
 * Actions for managing practice sessions and recording real-time metrics.
 */
interface SessionActions {
    /**
     * Starts a new practice session recording.
     *
     * @param exerciseId - Unique ID of the exercise.
     * @param exerciseName - Display name of the exercise.
     * @param mode - The session mode. Defaults to 'practice'.
     */
    start: (exerciseId: string, exerciseName: string, mode?: 'tuner' | 'practice') => void;
    /**
     * Ends the current session, calculates final metrics, and returns the data.
     *
     * @returns The completed {@link PracticeSession} or null if no session was active.
     */
    end: () => PracticeSession | null;
    /**
     * Records a single attempt at a specific note.
     *
     * @remarks
     * This method updates the rolling average of cents deviation for the note.
     *
     * @param noteIndex - Index of the note in the exercise.
     * @param pitch - Detected pitch name.
     * @param cents - Pitch deviation in cents.
     * @param inTune - Whether the attempt was within the current tolerance.
     */
    recordAttempt: (noteIndex: number, pitch: string, cents: number, inTune: boolean) => void;
    /**
     * Records the successful completion of a note.
     *
     * @remarks
     * Updates the perfect note streak if the average deviation is `< 5` cents.
     *
     * @param noteIndex - Index of the completed note.
     * @param timeMs - Total time taken to complete the note.
     * @param technique - Optional technique metrics.
     */
    recordCompletion: (noteIndex: number, timeMs: number, technique?: NoteTechnique) => void;
}
/**
 * Zustand store for tracking real-time practice session metrics and history.
 *
 * @remarks
 * This store serves as a high-frequency accumulator for session data. It is
 * decoupled from the long-term `ProgressStore` to ensure that real-time
 * updates don't trigger expensive persistence logic on every audio frame.
 *
 * @public
 */
export declare const useSessionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionState & SessionActions>>;
export {};
