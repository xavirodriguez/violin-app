/**
 * Fachada temporal para mantener compatibilidad con código existente
 * @deprecated Usar stores individuales directamente
 */
export declare const useAnalyticsStore: (() => {
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
    endSession: () => import("./session.store").PracticeSession | null;
    recordNoteAttempt: (noteIndex: number, pitch: string, cents: number, inTune: boolean) => void;
    recordNoteCompletion: (noteIndex: number, timeMs: number, technique?: any) => void;
    checkAndUnlockAchievements: () => import("./achievements.store").Achievement[];
    getSessionHistory: (days?: number) => import("./session.store").PracticeSession[];
    getExerciseStats: (exerciseId: string) => import("./progress.store").ExerciseStats;
    getTodayStats: () => {
        duration: number;
        accuracy: number;
        sessionsCount: number;
    };
    getStreakInfo: () => {
        current: number;
        longest: number;
    };
}) & {
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
    setState: (partial: any) => void;
    persist: {
        getOptions: () => {
            migrate: (persisted: any, version: number) => any;
        };
    };
};
