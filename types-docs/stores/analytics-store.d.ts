import { NoteTechnique } from '../lib/technique-types';
import type { Exercise } from '@/lib/domain/musical-types';
/**
 * Data model for a completed practice session.
 *
 * @public
 */
export interface PracticeSession {
    /** Unique session identifier (UUID). */
    id: string;
    /** Unix timestamp when the session started. */
    startTimeMs: number;
    /** Unix timestamp when the session ended. */
    endTimeMs: number;
    /** Total duration in milliseconds. */
    durationMs: number;
    /** ID of the exercise practiced. */
    exerciseId: string;
    /** Name of the exercise. */
    exerciseName: string;
    /** Mode of the session. */
    mode: 'tuner' | 'practice';
    /** Total number of pitch analysis frames processed. */
    notesAttempted: number;
    /** Total number of notes successfully matched. */
    notesCompleted: number;
    /** Overall accuracy percentage (0-100). */
    accuracy: number;
    /** Overall average pitch deviation in cents. */
    averageCents: number;
    /** Detailed results for each note played. */
    noteResults: NoteResult[];
}
/**
 * Metric summary for an individual note within a session.
 */
interface NoteResult {
    /** Index of the note in the exercise. */
    noteIndex: number;
    /** Expected scientific pitch name (e.g., "A4"). */
    targetPitch: string;
    /** Number of attempts/frames spent on this note. */
    attempts: number;
    /** Time taken to complete the note in milliseconds. */
    timeToCompleteMs: number;
    /** Average cents deviation for this note. */
    averageCents: number;
    /** Whether the note was eventually played in-tune. */
    wasInTune: boolean;
    /** Detected technique metrics (rhythm, attack, etc.). */
    technique?: NoteTechnique;
}
/**
 * Long-term progress and skill model for the user.
 *
 * @public
 */
export interface UserProgress {
    /** Unique user identifier. */
    userId: string;
    /** Count of all sessions ever started. */
    totalPracticeSessions: number;
    /** Lifetime practice time in seconds. */
    totalPracticeTime: number;
    /** List of IDs for exercises that have been completed at least once. */
    exercisesCompleted: Exercise['id'][];
    /** Consecutive days practiced. */
    currentStreak: number;
    /** Highest streak ever achieved. */
    longestStreak: number;
    /** Normalized skill level for intonation (0-100). */
    intonationSkill: number;
    /** Normalized skill level for rhythm (0-100). */
    rhythmSkill: number;
    /** Combined overall skill level (0-100). */
    overallSkill: number;
    /** List of unlocked achievements. */
    achievements: Achievement[];
    /** Map of per-exercise lifetime statistics. */
    exerciseStats: Record<string, ExerciseStats>;
}
/**
 * Persistent statistics for a specific exercise.
 */
interface ExerciseStats {
    /** ID of the exercise. */
    exerciseId: string;
    /** Number of times this exercise was completed. */
    timesCompleted: number;
    /** Highest accuracy ever achieved on this exercise. */
    bestAccuracy: number;
    /** Rolling average of accuracy across all attempts. */
    averageAccuracy: number;
    /** Fastest completion time recorded for this exercise. */
    fastestCompletionMs: number;
    /** Unix timestamp of the last time this exercise was practiced. */
    lastPracticedMs: number;
}
/**
 * Represents a musical achievement or milestone.
 *
 * @public
 */
export interface Achievement {
    /** Unique achievement ID. */
    id: string;
    /** Display name. */
    name: string;
    /** Description of how it was earned. */
    description: string;
    /** Icon or emoji representation. */
    icon: string;
    /** Unix timestamp of when it was unlocked. */
    unlockedAtMs: number;
}
/**
 * Interface for the Analytics Store, managing long-term progress and session history.
 *
 * @public
 */
export interface AnalyticsStore {
    /** The session currently being recorded, if any. */
    currentSession: PracticeSession | null;
    /** History of the last 100 completed sessions. */
    sessions: PracticeSession[];
    /** Aggregated user progress and achievements. */
    progress: UserProgress;
    /** Optional callback for when a new achievement is unlocked. */
    onAchievementUnlocked?: (achievement: Achievement) => void;
    /**
     * Initializes a new practice session recording.
     *
     * @param exerciseId - The ID of the exercise.
     * @param exerciseName - The name of the exercise.
     * @param mode - The session mode.
     */
    startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void;
    /**
     * Finalizes the current session, updates lifetime stats, and checks for achievements.
     */
    endSession: () => void;
    /**
     * Records a pitch detection attempt for the current session.
     *
     * @param noteIndex - Index of the note being played.
     * @param targetPitch - Expected pitch name.
     * @param cents - Deviation in cents.
     * @param wasInTune - Whether the attempt met the tolerance threshold.
     */
    recordNoteAttempt: (noteIndex: number, targetPitch: string, cents: number, wasInTune: boolean) => void;
    /**
     * Records the successful completion of a note.
     *
     * @param noteIndex - Index of the note.
     * @param timeToCompleteMs - Time taken.
     * @param technique - Detected technique details.
     */
    recordNoteCompletion: (noteIndex: number, timeToCompleteMs: number, technique?: NoteTechnique) => void;
    /**
     * Evaluates current stats against achievement criteria and unlocks any new milestones.
     */
    checkAndUnlockAchievements: () => void;
    /**
     * Current streak of notes played with high accuracy (`< 5` cents).
     */
    currentPerfectStreak: number;
    /**
     * Retrieves session history for a specific number of days.
     *
     * @param days - Number of days to look back.
     */
    getSessionHistory: (days?: number) => PracticeSession[];
    /**
     * Gets stats for a specific exercise.
     */
    getExerciseStats: (exerciseId: string) => ExerciseStats | null;
    /**
     * Calculates aggregated stats for the current calendar day.
     */
    getTodayStats: () => {
        duration: number;
        accuracy: number;
        sessionsCount: number;
    };
    /**
     * Returns current and longest practice streaks.
     */
    getStreakInfo: () => {
        current: number;
        longest: number;
    };
}
/**
 * Zustand store for persistent analytics, progress tracking, and achievement management.
 *
 * @remarks
 * This store uses `persist` middleware to save user progress to local storage.
 * It manages:
 * 1. **Session Lifecycle**: Handles the transition from active recording to historical data.
 * 2. **Skill Level Heuristics**: Calculates normalized intonation and rhythm scores based on recent performance.
 * 3. **Daily Streaks**: Tracks consistency using a rolling 24-hour window.
 * 4. **Schema Migrations**: Implements robust logic for handling legacy data formats (versions 1-3).
 *
 * @public
 */
export declare const useAnalyticsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AnalyticsStore>, "setState" | "persist"> & {
    setState(partial: AnalyticsStore | Partial<AnalyticsStore> | ((state: AnalyticsStore) => AnalyticsStore | Partial<AnalyticsStore>), replace?: false | undefined): unknown;
    setState(state: AnalyticsStore | ((state: AnalyticsStore) => AnalyticsStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, Pick<AnalyticsStore, "sessions" | "progress">, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AnalyticsStore) => void) => () => void;
        onFinishHydration: (fn: (state: AnalyticsStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, Pick<AnalyticsStore, "sessions" | "progress">, unknown>>;
    };
}>;
export {};
