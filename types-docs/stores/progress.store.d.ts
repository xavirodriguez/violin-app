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
export declare const useProgressStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ProgressState & ProgressActions>>;
export {};
