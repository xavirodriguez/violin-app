import { PracticeSession } from './session.store';
export interface ProgressEvent {
    ts: number;
    exerciseId: string;
    accuracy: number;
    rhythmErrorMs: number;
}
export interface SkillAggregates {
    intonation: number;
    rhythm: number;
    overall: number;
}
export interface ProgressSnapshot {
    userId: string;
    window: '7d' | '30d' | 'all';
    aggregates: SkillAggregates;
    lastSessionId: string;
}
export interface ExerciseStats {
    exerciseId: string;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
    fastestCompletionMs: number;
    lastPracticedMs: number;
}
export interface ProgressState {
    schemaVersion: 1;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: string[];
    currentStreak: number;
    longestStreak: number;
    intonationSkill: number;
    rhythmSkill: number;
    overallSkill: number;
    exerciseStats: Record<string, ExerciseStats>;
    eventBuffer: ProgressEvent[];
    snapshots: ProgressSnapshot[];
    eventCounter: number;
}
interface ProgressActions {
    addSession: (session: PracticeSession) => void;
    updateSkills: (sessions: PracticeSession[]) => void;
}
export declare const useProgressStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ProgressState & ProgressActions>, "setState" | "persist"> & {
    setState(partial: (ProgressState & ProgressActions) | Partial<ProgressState & ProgressActions> | ((state: ProgressState & ProgressActions) => (ProgressState & ProgressActions) | Partial<ProgressState & ProgressActions>), replace?: false | undefined): unknown;
    setState(state: (ProgressState & ProgressActions) | ((state: ProgressState & ProgressActions) => ProgressState & ProgressActions), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ProgressState & ProgressActions, ProgressState & ProgressActions, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ProgressState & ProgressActions) => void) => () => void;
        onFinishHydration: (fn: (state: ProgressState & ProgressActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ProgressState & ProgressActions, ProgressState & ProgressActions, unknown>>;
    };
}>;
export {};
