import { PracticeSession } from '@/lib/domain/practice-session';
/**
 * Event representing a completed exercise within the progress history.
 *
 * @remarks
 * Used in the high-density circular buffer to track historical trends.
 *
 * @public
 */
export interface ProgressEvent {
    /** Unix timestamp of when the session ended. */
    ts: number;
    /** ID of the exercise practiced. */
    exerciseId: string;
    /** Accuracy achieved during the session (0-100). */
    accuracy: number;
    /** Average rhythmic error in milliseconds for the session. */
    rhythmErrorMs: number;
}
/**
 * Aggregated skill metrics across multiple technical domains.
 *
 * @public
 */
export interface SkillAggregates {
    /** Intonation accuracy score (0-100). Higher is better. */
    intonation: number;
    /** Rhythmic precision score (0-100). Based on onset timing error. */
    rhythm: number;
    /** Overall combined skill level based on pedagogical heuristics. */
    overall: number;
}
/**
 * A snapshot of the user's progress at a specific point in time.
 *
 * @remarks
 * Snapshots provide a historical record of technical growth, allowing the UI
 * to render progress charts over different time windows (7d, 30d).
 *
 * @public
 */
export interface ProgressSnapshot {
    /** The user identifier (defaults to 'anonymous' in standalone mode). */
    userId: string;
    /** The time window covered by this snapshot. */
    window: '7d' | '30d' | 'all';
    /** Aggregated skill levels captured at the time of snapshot creation. */
    aggregates: SkillAggregates;
    /** ID of the practice session that triggered this snapshot. */
    lastSessionId: string;
}
/**
 * Lifetime statistics for an individual exercise.
 *
 * @remarks
 * These metrics are used by the `ExerciseRecommender` to determine mastery
 * and suggest review cycles.
 *
 * @public
 */
export interface ExerciseStats {
    /** ID of the exercise. */
    exerciseId: string;
    /** Total number of times this exercise was successfully completed. */
    timesCompleted: number;
    /** Highest accuracy percentage ever recorded for this exercise. */
    bestAccuracy: number;
    /** Rolling average of accuracy across all historical attempts. */
    averageAccuracy: number;
    /** Fastest completion time ever recorded (ms). */
    fastestCompletionMs: number;
    /** Unix timestamp of the most recent practice attempt. */
    lastPracticedMs: number;
}
/**
 * State structure for the Progress Store.
 *
 * @remarks
 * This interface defines the shape of the user's persistent technical profile.
 *
 * @public
 */
export interface ProgressState {
    /** Version of the persistence schema for handling automated migrations. */
    schemaVersion: 1;
    /** Lifetime count of all started practice sessions. */
    totalPracticeSessions: number;
    /** Total lifetime practice time in seconds. */
    totalPracticeTime: number;
    /** IDs of unique exercises that have been completed at least once. */
    exercisesCompleted: string[];
    /** Current daily practice streak (number of consecutive days). */
    currentStreak: number;
    /** Highest daily streak recorded since account creation. */
    longestStreak: number;
    /** Current calculated intonation skill level (0-100). */
    intonationSkill: number;
    /** Current calculated rhythm skill level (0-100). */
    rhythmSkill: number;
    /** Combined overall skill level (0-100). */
    overallSkill: number;
    /** Map of exercise IDs to their detailed lifetime statistics. */
    exerciseStats: Record<string, ExerciseStats>;
    /** Circular buffer of recent progress events (maximum 1000 items). */
    eventBuffer: ProgressEvent[];
    /** Historical snapshots used for long-term trend analysis and charting. */
    snapshots: ProgressSnapshot[];
    /** Internal counter of sessions processed since last snapshot. */
    eventCounter: number;
}
/**
 * Actions available in the Progress Store for updating user performance.
 *
 * @public
 */
interface ProgressActions {
    /**
     * Integrates a completed session into the long-term progress history.
     *
     * @remarks
     * **Side Effects & Logic**:
     * 1. **Aggregation**: Updates lifetime session count and total practice time in seconds.
     * 2. **Mastery Stats**: Recalculates `ExerciseStats` for the given ID, including
     *    `bestAccuracy` and `fastestCompletionMs`.
     * 3. **Circular Buffer**: Pushes a new {@link ProgressEvent} to the `eventBuffer`.
     *    The buffer is capped at 1000 items to balance historical depth with memory usage.
     * 4. **Incremental Snapshots**: Automatically triggers a {@link ProgressSnapshot}
     *    every 50 events. This ensures long-term trends are preserved even if the
     *    buffer is pruned.
     * 5. **TTL Pruning**: Removes any events from the buffer that are older than
     *    90 days to comply with data retention best practices.
     *
     * @param session - The completed session data to persist and analyze.
     */
    addSession: (session: PracticeSession) => void;
    /**
     * Re-calculates domain-specific skill levels (intonation, rhythm).
     *
     * @remarks
     * Skill levels are calculated using weighted heuristics that prioritize recent
     * session performance over historical data.
     *
     * @param sessions - Recent session history to analyze.
     */
    updateSkills: (sessions: PracticeSession[]) => void;
}
/**
 * Zustand store for high-density, persistent progress tracking.
 *
 * @remarks
 * This store is the "Brain" of the user's progress. It is optimized for
 * durability and efficient historical analysis.
 *
 * **Architecture**:
 * - **Persistence**: Uses `validatedPersist` to ensure `localStorage` data remains
 *   valid according to the `ProgressStateSchema`.
 * - **Data Lifecycle**: Implements automatic pruning of old high-frequency data (90-day TTL)
 *   while preserving long-term aggregates in `snapshots`.
 * - **Skill Engine**: Encapsulates heuristics for determining violin mastery levels.
 *
 * @example
 * ```ts
 * const { overallSkill, addSession } = useProgressStore();
 * ```
 *
 * @public
 */
export declare const useProgressStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ProgressState & ProgressActions>>;
export {};
