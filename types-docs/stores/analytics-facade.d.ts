import { PracticeSession } from '@/lib/domain/practice';
import { ProgressState } from './progress.store';
import { Achievement } from '@/lib/domain/practice';
import { NoteTechnique } from '@/lib/technique-types';
interface AnalyticsFacadePartialState {
    progress?: Partial<ProgressState> & {
        achievements?: Achievement[];
    };
    sessions?: PracticeSession[];
    currentSession?: PracticeSession | undefined;
    currentPerfectStreak?: number;
}
/**
 * Analytics facade.
 *
 * @remarks
 * This module exposes both hook-oriented and imperative access patterns by aggregating
 * multiple stores (Session, Progress, Achievements, History) into a single interface.
 *
 * Some imperative `getState()` methods are compatibility stubs and do not execute
 * the full analytics pipeline. When adding new consumers, prefer the hook-backed
 * implementation unless the imperative method is explicitly documented as fully implemented.
 *
 * @deprecated Use individual stores (e.g., `useSessionStore`, `useProgressStore`) directly.
 * @public
 */
export declare const useAnalyticsStore: (() => {
    /** The current active session, if any. */
    currentSession: import("@/lib/domain/practice").LivePracticeSession | undefined;
    /** History of completed sessions. */
    sessions: import("@/lib/domain/practice").CompletedPracticeSession[];
    /** Aggregated user progress. */
    progress: {
        achievements: Achievement[];
        schemaVersion: 1;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        currentStreak: number;
        longestStreak: number;
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        exerciseStats: Record<string, import("@/lib/domain/practice").ExerciseStats>;
        eventBuffer: import("./progress.store").ProgressEvent[];
        snapshots: import("./progress.store").ProgressSnapshot[];
        eventCounter: number;
        addSession: (session: import("@/lib/domain/practice").CompletedPracticeSession) => void;
        updateSkills: (sessions: import("@/lib/domain/practice").CompletedPracticeSession[]) => void;
    };
    /** Current streak of perfect notes. */
    currentPerfectStreak: number;
    /** Starts a new session. */
    startSession: (exerciseId: string, exerciseName: string, mode?: "tuner" | "practice") => void;
    /** Ends the current session and updates related stores. */
    endSession: () => import("@/lib/domain/practice").CompletedPracticeSession | undefined;
    /** Records an attempt at a note. */
    recordNoteAttempt: (params: {
        noteIndex: number;
        pitch: string;
        cents: number;
        inTune: boolean;
    }) => void;
    /** Records a completed note and checks for achievements. */
    recordNoteCompletion: (params: {
        noteIndex: number;
        timeMs: number;
        technique?: NoteTechnique;
    }) => void;
    /** Manually triggers an achievement check. */
    checkAndUnlockAchievements: () => Achievement[];
    /** Retrieves filtered session history. */
    getSessionHistory: (days?: number) => import("@/lib/domain/practice").CompletedPracticeSession[];
    /** Gets stats for a specific exercise. */
    getExerciseStats: (exerciseId: string) => import("@/lib/domain/practice").ExerciseStats;
    /**
     * Stub implementation for the facade.
     *
     * @remarks
     * Always returns zeroed stats:
     * `{ duration: 0, accuracy: 0, sessionsCount: 0 }`.
     *
     * Use the hook-backed analytics facade or the concrete analytics store when
     * real current-day statistics are required.
     */
    getTodayStats: () => {
        duration: number;
        accuracy: number;
        sessionsCount: number;
    };
    /** Returns streak information. */
    getStreakInfo: () => {
        current: number;
        longest: number;
    };
}) & {
    /** Imperative access to the facade's state. */
    getState: () => {
        currentSession: import("@/lib/domain/practice").LivePracticeSession | undefined;
        sessions: import("@/lib/domain/practice").CompletedPracticeSession[];
        progress: {
            achievements: Achievement[];
            schemaVersion: 1;
            totalPracticeSessions: number;
            totalPracticeTime: number;
            exercisesCompleted: string[];
            currentStreak: number;
            longestStreak: number;
            intonationSkill: number;
            rhythmSkill: number;
            overallSkill: number;
            exerciseStats: Record<string, import("@/lib/domain/practice").ExerciseStats>;
            eventBuffer: import("./progress.store").ProgressEvent[];
            snapshots: import("./progress.store").ProgressSnapshot[];
            eventCounter: number;
            addSession: (session: import("@/lib/domain/practice").CompletedPracticeSession) => void;
            updateSkills: (sessions: import("@/lib/domain/practice").CompletedPracticeSession[]) => void;
        };
        currentPerfectStreak: number;
        startSession: (exerciseId: string, exerciseName: string, mode?: "tuner" | "practice") => void;
        recordNoteAttempt: (params: {
            noteIndex: number;
            pitch: string;
            cents: number;
            inTune: boolean;
        }) => void;
        recordNoteCompletion: (params: {
            noteIndex: number;
            timeMs: number;
            technique?: NoteTechnique;
        }) => void;
        endSession: () => import("@/lib/domain/practice").CompletedPracticeSession | undefined;
        /**
         * Stub implementation for the imperative facade.
         *
         * @remarks
         * Does not perform achievement evaluation and always returns an empty array.
         * Use the hook-backed facade or the concrete achievements store when actual
         * unlock checks are required.
         */
        checkAndUnlockAchievements: () => never[];
    };
    /** Imperative state update (for compatibility). */
    setState: (partial: AnalyticsFacadePartialState) => void;
    /** Persistence options for the facade (migrated from legacy). */
    persist: {
        getOptions: () => {
            migrate: (persisted: unknown, version: number) => unknown;
        };
    };
};
export {};
