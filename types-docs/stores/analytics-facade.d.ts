import { PracticeSession } from '@/lib/domain/practice-session';
import { ProgressState } from './progress.store';
import { Achievement } from './achievements.store';
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
    currentSession: PracticeSession | undefined;
    /** History of completed sessions. */
    sessions: PracticeSession[];
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
        exerciseStats: Record<string, import("./progress.store").ExerciseStats>;
        eventBuffer: import("./progress.store").ProgressEvent[];
        snapshots: import("./progress.store").ProgressSnapshot[];
        eventCounter: number;
        addSession: (session: PracticeSession) => void;
        updateSkills: (sessions: PracticeSession[]) => void;
    };
    /** Current streak of perfect notes. */
    currentPerfectStreak: number;
    /** Starts a new session. */
    startSession: (exerciseId: string, exerciseName: string, mode?: "tuner" | "practice") => void;
    /** Ends the current session and updates related stores. */
    endSession: () => PracticeSession | undefined;
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
    getSessionHistory: (days?: number) => PracticeSession[];
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
        currentSession: PracticeSession | undefined;
        sessions: PracticeSession[];
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
            exerciseStats: Record<string, import("./progress.store").ExerciseStats>;
            eventBuffer: import("./progress.store").ProgressEvent[];
            snapshots: import("./progress.store").ProgressSnapshot[];
            eventCounter: number;
            addSession: (session: PracticeSession) => void;
            updateSkills: (sessions: PracticeSession[]) => void;
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
        endSession: () => PracticeSession | undefined;
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
