import { NoteTechnique } from '../technique-types';
interface Note {
    pitch: string;
    duration: string;
    measure: number;
}
interface Exercise {
    id: string;
    name: string;
    notes: Note[];
}
/** Represents a single, completed practice session. */
export interface PracticeSession {
    /** A unique identifier for the session. */
    id: string;
    /** The timestamp when the session started, in milliseconds. */
    startTimeMs: number;
    /** The timestamp when the session ended, in milliseconds. */
    endTimeMs: number;
    /** The total duration of the session, in seconds. */
    duration: number;
    /** The ID of the exercise that was practiced. */
    exerciseId: string;
    /** The name of the exercise that was practiced. */
    exerciseName: string;
    /** The mode the user was in during the session. */
    mode: 'tuner' | 'practice';
    /** The total number of notes the user attempted to play. */
    notesAttempted: number;
    /** The total number of notes the user successfully completed. */
    notesCompleted: number;
    /** The overall accuracy for the session, as a percentage from 0 to 100. */
    accuracy: number;
    /** The average pitch deviation for all attempted notes, in cents. */
    averageCents: number;
    /** Detailed results for each note within the exercise. */
    noteResults: NoteResult[];
}
/** Contains detailed metrics for a single note within a practice session. */
interface NoteResult {
    /** The zero-based index of the note in the exercise. */
    noteIndex: number;
    /** The target pitch of the note (e.g., "G4"). */
    targetPitch: string;
    /** The number of times the user tried to play this note. */
    attempts: number;
    /** The time it took to successfully match the note from the first attempt, in milliseconds. */
    timeToComplete: number;
    /** The average pitch deviation for this specific note across all attempts, in cents. */
    averageCents: number;
    /** A boolean indicating if the final attempt was in tune. */
    wasInTune: boolean;
    /** Optional technical analysis metrics for this note. */
    technique?: NoteTechnique;
}
/** A comprehensive model of the user's long-term progress and stats. */
interface UserProgress {
    /** The unique identifier for the user. */
    userId: string;
    /** The total number of practice sessions the user has completed. */
    totalPracticeSessions: number;
    /** The cumulative time the user has spent practicing, in seconds. */
    totalPracticeTime: number;
    /** A list of unique exercise IDs that the user has completed at least once. */
    exercisesCompleted: Exercise['id'][];
    /** The current consecutive daily practice streak, in days. */
    currentStreak: number;
    /** The longest consecutive daily practice streak the user has ever achieved, in days. */
    longestStreak: number;
    /** A calculated skill score for intonation (pitch accuracy), from 0 to 100. */
    intonationSkill: number;
    /** A calculated skill score for rhythm (timing accuracy), from 0 to 100. */
    rhythmSkill: number;
    /** A combined overall skill score, from 0 to 100. */
    overallSkill: number;
    /** A list of achievements the user has unlocked. */
    achievements: Achievement[];
    /** A record of performance statistics for each exercise, keyed by exercise ID. */
    exerciseStats: Record<string, ExerciseStats>;
}
/** Stores lifetime performance statistics for a specific exercise. */
interface ExerciseStats {
    /** The ID of the exercise these stats belong to. */
    exerciseId: string;
    /** The total number of times this exercise has been completed. */
    timesCompleted: number;
    /** The highest accuracy score achieved for this exercise, from 0 to 100. */
    bestAccuracy: number;
    /** The average accuracy score across all completions of this exercise, from 0 to 100. */
    averageAccuracy: number;
    /** The shortest time taken to complete this exercise, in seconds. */
    fastestCompletion: number;
    /** The timestamp when this exercise was last practiced, in milliseconds. */
    lastPracticedMs: number;
}
/** Represents a single unlockable achievement. */
export interface Achievement {
    /** A unique identifier for the achievement. */
    id: string;
    /** The display name of the achievement. */
    name: string;
    /** A description of how to unlock the achievement. */
    description: string;
    /** An emoji or icon representing the achievement. */
    icon: string;
    /** The timestamp when the achievement was unlocked, in milliseconds. */
    unlockedAtMs: number;
}
/**
 * Defines the state and actions for the analytics Zustand store.
 *
 * @remarks
 * This store is responsible for tracking user performance, both within a single
 * practice session and over the long term. It persists its data to local storage.
 */
interface AnalyticsStore {
    /**
     * The currently active practice session. `null` if no session is in progress.
     */
    currentSession: PracticeSession | null;
    /**
     * A historical log of the user's most recent practice sessions.
     */
    sessions: PracticeSession[];
    /**
     * The user's aggregated long-term progress, skills, and achievements.
     */
    progress: UserProgress;
    /**
     * Starts a new practice session.
     *
     * @param exerciseId - The ID of the exercise being practiced.
     * @param exerciseName - The name of the exercise.
     * @param mode - The practice mode ('tuner' or 'practice').
     */
    startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void;
    /**
     * Ends the current practice session, calculates final metrics, and persists the data.
     */
    endSession: () => void;
    /**
     * Records an attempt to play a specific note.
     *
     * @param noteIndex - The index of the note in the exercise.
     * @param targetPitch - The target pitch of the note.
     * @param cents - The pitch deviation of the attempt.
     * @param wasInTune - Whether the attempt was considered in tune.
     */
    recordNoteAttempt: (noteIndex: number, targetPitch: string, cents: number, wasInTune: boolean) => void;
    /**
     * Records the successful completion of a note.
     *
     * @param noteIndex - The index of the completed note.
     * @param timeToComplete - The time taken to complete the note, in milliseconds.
     * @param technique - Optional technical analysis metrics.
     */
    recordNoteCompletion: (noteIndex: number, timeToComplete: number, technique?: NoteTechnique) => void;
    /**
     * Retrieves a filtered list of recent practice sessions.
     *
     * @param days - The number of past days to include sessions from.
     * @defaultValue 7
     * @returns An array of `PracticeSession` objects.
     */
    getSessionHistory: (days?: number) => PracticeSession[];
    /**
     * Retrieves the lifetime statistics for a specific exercise.
     *
     * @param exerciseId - The ID of the exercise to look up.
     * @returns The `ExerciseStats` object, or `null` if none exist.
     */
    getExerciseStats: (exerciseId: string) => ExerciseStats | null;
    /**
     * Calculates and returns key performance statistics for the current day.
     */
    getTodayStats: () => {
        duration: number;
        accuracy: number;
        sessionsCount: number;
    };
    /**
     * Returns the user's current and longest practice streaks.
     */
    getStreakInfo: () => {
        current: number;
        longest: number;
    };
}
/**
 * A Zustand store for tracking and persisting user analytics and progress.
 *
 * @remarks
 * This store captures detailed metrics from each practice session, aggregates
 * historical data, and calculates long-term skill progression. It uses the
 * `persist` middleware to save its state to the browser's local storage under
 * the key 'violin-analytics', making user progress durable across sessions.
 */
export declare const useAnalyticsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AnalyticsStore>, "setState" | "persist"> & {
    setState(partial: AnalyticsStore | Partial<AnalyticsStore> | ((state: AnalyticsStore) => AnalyticsStore | Partial<AnalyticsStore>), replace?: false | undefined): unknown;
    setState(state: AnalyticsStore | ((state: AnalyticsStore) => AnalyticsStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, any, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AnalyticsStore) => void) => () => void;
        onFinishHydration: (fn: (state: AnalyticsStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, any, unknown>>;
    };
}>;
export {};
