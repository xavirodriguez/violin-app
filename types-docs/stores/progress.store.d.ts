import { PracticeSession } from './session.store';
/**
 * Event representing a completed exercise within the progress history.
 *
 * @public
 */
export interface ProgressEvent {
    /** Unix timestamp of the event. */
    ts: number;
    /** ID of the exercise practiced. */
    exerciseId: string;
    /** Accuracy achieved during the session (0-100). */
    accuracy: number;
    /** Average rhythmic error in milliseconds for the session. */
    rhythmErrorMs: number;
}
/**
 * Aggregated skill metrics across multiple domains.
 *
 * @public
 */
export interface SkillAggregates {
    /** Intonation accuracy score (0-100). */
    intonation: number;
    /** Rhythmic precision score (0-100). */
    rhythm: number;
    /** Overall combined skill level based on multiple heuristics. */
    overall: number;
}
/**
 * A snapshot of the user's progress at a specific point in time.
 *
 * @remarks
 * Snapshots are used to track trends over time (e.g., 7-day or 30-day improvements).
 *
 * @public
 */
export interface ProgressSnapshot {
    /** The user identifier. */
    userId: string;
    /** The time window covered by this specific snapshot. */
    window: '7d' | '30d' | 'all';
    /** Aggregated skills at the time of the snapshot. */
    aggregates: SkillAggregates;
    /** ID of the session that triggered the creation of this snapshot. */
    lastSessionId: string;
}
/**
 * Lifetime statistics for an individual exercise.
 *
 * @public
 */
export interface ExerciseStats {
    /** ID of the exercise. */
    exerciseId: string;
    /** Total number of times this exercise was completed. */
    timesCompleted: number;
    /** Highest accuracy percentage ever recorded. */
    bestAccuracy: number;
    /** Rolling average of accuracy across all attempts. */
    averageAccuracy: number;
    /** Fastest completion time in milliseconds. */
    fastestCompletionMs: number;
    /** Unix timestamp of the most recent attempt. */
    lastPracticedMs: number;
}
/**
 * State structure for the Progress Store.
 *
 * @public
 */
export interface ProgressState {
    /** Version of the persistence schema for migrations. */
    schemaVersion: 1;
    /** Lifetime count of all started practice sessions. */
    totalPracticeSessions: number;
    /** Total lifetime practice time in seconds. */
    totalPracticeTime: number;
    /** IDs of unique exercises that have been completed at least once. */
    exercisesCompleted: string[];
    /** Current daily practice streak. */
    currentStreak: number;
    /** Highest daily streak recorded for this user. */
    longestStreak: number;
    /** Current calculated intonation skill level (0-100). */
    intonationSkill: number;
    /** Current calculated rhythm skill level (0-100). */
    rhythmSkill: number;
    /** Combined overall skill level (0-100). */
    overallSkill: number;
    /** Map of exercise IDs to their lifetime statistics. */
    exerciseStats: Record<string, ExerciseStats>;
    /** Circular buffer of recent progress events (maximum 1000). */
    eventBuffer: ProgressEvent[];
    /** Historical snapshots of progress used for charting trends. */
    snapshots: ProgressSnapshot[];
    /** Internal counter of events processed, used to trigger periodic snapshots. */
    eventCounter: number;
}
/**
 * Actions available in the Progress Store for updating user performance.
 */
interface ProgressActions {
    /**
     * Integrates a completed session into the long-term progress history.
     *
     * @remarks
     * This method performs several side effects:
     * 1. Updates lifetime counters and exercise-specific stats.
     * 2. Manages the circular event buffer.
     * 3. Triggers a new snapshot every 50 events.
     * 4. Prunes events older than 90 days.
     *
     * @param session - The completed session data to integrate.
     */
    addSession: (session: PracticeSession) => void;
    /**
     * Re-calculates domain-specific skill levels based on the provided session history.
     *
     * @param sessions - Recent session history to analyze.
     */
    updateSkills: (sessions: PracticeSession[]) => void;
}
/**
 * Zustand store for high-density, persistent progress tracking.
 *
 * @remarks
 * This store is designed for durability and performance when handling large volumes
 * of historical practice data. Key features include:
 * - **High-Density Storage**: Uses a circular buffer to limit memory usage while keeping detailed recent history.
 * - **Incremental Snapshots**: Efficiently tracks long-term trends without re-processing all history.
 * - **Schema Migrations**: Safely handles data format changes over time.
 * - **Zod Validation**: Ensures the integrity of persisted data in `localStorage`.
 *
 * @public
 */
export declare const useProgressStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ProgressState & ProgressActions>>;
export {};
