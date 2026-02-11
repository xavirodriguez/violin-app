/**
 * Temporary facade to maintain backward compatibility with the legacy analytics API.
 *
 * @remarks
 * This object aggregates multiple stores (Session, Progress, Achievements, History)
 * into a single interface. New code should prefer using the individual stores directly.
 *
 * @deprecated Use individual stores (e.g., `useSessionStore`, `useProgressStore`) directly.
 * @public
 */
export declare const useAnalyticsStore: (() => {
    /** The current active session, if any. */
    currentSession: import("./session.store").PracticeSession | null;
    /** History of completed sessions. */
    sessions: import("./session.store").PracticeSession[];
    /** Aggregated user progress. */
    progress: {
        achievements: import("./achievements.store").Achievement[];
        schemaVersion: 1;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        currentStreak: number;
        longestStreak: number;
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        exerciseStats: Record<string, import("./progress.store").ExerciseStats>;
        eventBuffer: import("./progress.store").ProgressEvent[];
        snapshots: import("./progress.store").ProgressSnapshot[];
        eventCounter: number;
        addSession: (session: import("./session.store").PracticeSession) => void;
        updateSkills: (sessions: import("./session.store").PracticeSession[]) => void;
    };
    /** Current streak of perfect notes. */
    currentPerfectStreak: number;
    /** Starts a new session. */
    startSession: (exerciseId: string, exerciseName: string, mode?: "tuner" | "practice") => void;
    /** Ends the current session and updates related stores. */
    endSession: () => import("./session.store").PracticeSession | null;
    /** Records an attempt at a note. */
    recordNoteAttempt: (noteIndex: number, pitch: string, cents: number, inTune: boolean) => void;
    /** Records a completed note and checks for achievements. */
    recordNoteCompletion: (noteIndex: number, timeMs: number, technique?: any) => void;
    /** Manually triggers an achievement check. */
    checkAndUnlockAchievements: () => import("./achievements.store").Achievement[];
    /** Retrieves filtered session history. */
    getSessionHistory: (days?: number) => import("./session.store").PracticeSession[];
    /** Gets stats for a specific exercise. */
    getExerciseStats: (exerciseId: string) => import("./progress.store").ExerciseStats;
    /** Returns summary stats for the current day. */
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
        currentSession: import("./session.store").PracticeSession | null;
        sessions: import("./session.store").PracticeSession[];
        progress: {
            achievements: import("./achievements.store").Achievement[];
            schemaVersion: 1;
            totalPracticeSessions: number;
            totalPracticeTime: number;
            exercisesCompleted: string[];
            currentStreak: number;
            longestStreak: number;
            intonationSkill: number;
            rhythmSkill: number;
            overallSkill: number;
            exerciseStats: Record<string, import("./progress.store").ExerciseStats>;
            eventBuffer: import("./progress.store").ProgressEvent[];
            snapshots: import("./progress.store").ProgressSnapshot[];
            eventCounter: number;
            addSession: (session: import("./session.store").PracticeSession) => void;
            updateSkills: (sessions: import("./session.store").PracticeSession[]) => void;
        };
        currentPerfectStreak: number;
        startSession: (exerciseId: string, exerciseName: string, mode?: "tuner" | "practice") => void;
        recordNoteAttempt: (noteIndex: number, pitch: string, cents: number, inTune: boolean) => void;
        recordNoteCompletion: (noteIndex: number, timeMs: number, technique?: import("../lib/technique-types").NoteTechnique) => void;
        endSession: () => import("./session.store").PracticeSession | null;
        checkAndUnlockAchievements: () => never[];
    };
    /** Imperative state update (for compatibility). */
    setState: (partial: Partial<{
        progress: any;
        sessions: any[];
        currentSession: any;
        currentPerfectStreak: number;
    }>) => void;
    /** Persistence options for the facade (migrated from legacy). */
    persist: {
        getOptions: () => {
            migrate: (persisted: any, version: number) => any;
        };
    };
};
