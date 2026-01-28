import { NoteTechnique } from '../lib/technique-types';
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
    id: string;
    startTimeMs: number;
    endTimeMs: number;
    durationMs: number;
    exerciseId: string;
    exerciseName: string;
    mode: 'tuner' | 'practice';
    notesAttempted: number;
    notesCompleted: number;
    accuracy: number;
    averageCents: number;
    noteResults: NoteResult[];
}
/** Contains detailed metrics for a single note within a practice session. */
interface NoteResult {
    noteIndex: number;
    targetPitch: string;
    attempts: number;
    timeToCompleteMs: number;
    averageCents: number;
    wasInTune: boolean;
    technique?: NoteTechnique;
}
/** A comprehensive model of the user's long-term progress and stats. */
interface UserProgress {
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
/** Stores lifetime performance statistics for a specific exercise. */
interface ExerciseStats {
    exerciseId: string;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
    fastestCompletionMs: number;
    lastPracticedMs: number;
}
/** Represents a single unlockable achievement. */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAtMs: number;
}
/**
 * Defines the state and actions for the analytics Zustand store.
 */
interface AnalyticsStore {
    currentSession: PracticeSession | null;
    sessions: PracticeSession[];
    progress: UserProgress;
    startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void;
    endSession: () => void;
    recordNoteAttempt: (noteIndex: number, targetPitch: string, cents: number, wasInTune: boolean) => void;
    recordNoteCompletion: (noteIndex: number, timeToCompleteMs: number, technique?: NoteTechnique) => void;
    getSessionHistory: (days?: number) => PracticeSession[];
    getExerciseStats: (exerciseId: string) => ExerciseStats | null;
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
