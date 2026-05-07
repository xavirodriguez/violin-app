import { NoteTechnique } from '../lib/technique-types';
import { LivePracticeSession, PersistedPracticeSession, ExerciseStats, Achievement } from '@/lib/domain/practice';
import type { Exercise } from '@/lib/domain/exercise';
/**
 * Long-term progress and skill model for the user.
 */
export interface UserProgress {
    userId: string;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: Exercise['id'][];
    currentStreak: number;
    longestStreak: number;
    intonationSkill: number;
    rhythmSkill: number;
    overallSkill: number;
    achievements: Achievement[];
    exerciseStats: Record<string, ExerciseStats>;
}
/** Parameters for recording a note attempt. */
export interface RecordAttemptParams {
    noteIndex: number;
    targetPitch: string;
    cents: number;
    wasInTune: boolean;
}
/** Parameters for recording a note completion. */
export interface RecordCompletionParams {
    noteIndex: number;
    timeToCompleteMs?: number;
    technique?: NoteTechnique;
}
/**
 * Interface for the Analytics Store, managing long-term progress and session history.
 *
 * @remarks
 * This store acts as the primary repository for user performance data.
 * It is responsible for:
 * 1. **Session Management**: Tracking the lifecycle of individual practice sessions.
 * 2. **Persistence**: Versioned storage of history using `localStorage` with automated migrations.
 * 3. **Achievement Tracking**: Evaluating performance against technical milestones.
 * 4. **Skill Evaluation**: Calculating long-term metrics for intonation and rhythm.
 *
 * @public
 */
export interface AnalyticsStore {
    currentSession: LivePracticeSession | undefined;
    cleanOldSessions: (count?: number) => void;
    sessions: PersistedPracticeSession[];
    progress: UserProgress;
    onAchievementUnlocked?: (achievement: Achievement) => void;
    currentPerfectStreak: number;
    startSession: (params: {
        exerciseId: string;
        exerciseName: string;
        mode: 'tuner' | 'practice';
    }) => void;
    endSession: () => void;
    recordNoteAttempt: (params: RecordAttemptParams) => void;
    recordNoteCompletion: (params: RecordCompletionParams) => void;
    checkAndUnlockAchievements: () => void;
    getSessionHistory: (days?: number) => PersistedPracticeSession[];
    getExerciseStats: (exerciseId: string) => ExerciseStats | undefined;
    getTodayStats: () => {
        duration: number;
        accuracy: number;
        sessionsCount: number;
    };
    getStreakInfo: () => {
        current: number;
        longest: number;
    };
}
/**
 * Zustand store for persistent analytics and progress tracking.
 */
export declare const useAnalyticsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AnalyticsStore>, "setState" | "persist"> & {
    setState(partial: AnalyticsStore | Partial<AnalyticsStore> | ((state: AnalyticsStore) => AnalyticsStore | Partial<AnalyticsStore>), replace?: false | undefined): unknown;
    setState(state: AnalyticsStore | ((state: AnalyticsStore) => AnalyticsStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, Pick<AnalyticsStore, "progress" | "sessions">, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AnalyticsStore) => void) => () => void;
        onFinishHydration: (fn: (state: AnalyticsStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AnalyticsStore, Pick<AnalyticsStore, "progress" | "sessions">, unknown>>;
    };
}>;
