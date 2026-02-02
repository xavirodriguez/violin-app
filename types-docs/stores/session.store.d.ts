import { NoteTechnique } from '../lib/technique-types';
export interface NoteResult {
    noteIndex: number;
    targetPitch: string;
    attempts: number;
    timeToCompleteMs?: number;
    averageCents: number;
    wasInTune: boolean;
    technique?: NoteTechnique;
}
export interface PracticeSession {
    id: string;
    startTimeMs: number;
    endTimeMs: number;
    durationMs: number;
    exerciseId: string;
    exerciseName: string;
    mode: 'tuner' | 'practice';
    noteResults: NoteResult[];
    notesAttempted: number;
    notesCompleted: number;
    accuracy: number;
    averageCents: number;
}
interface SessionState {
    current: PracticeSession | null;
    isActive: boolean;
    perfectNoteStreak: number;
}
interface SessionActions {
    start: (exerciseId: string, exerciseName: string, mode?: 'tuner' | 'practice') => void;
    end: () => PracticeSession | null;
    recordAttempt: (noteIndex: number, pitch: string, cents: number, inTune: boolean) => void;
    recordCompletion: (noteIndex: number, timeMs: number, technique?: NoteTechnique) => void;
}
export declare const useSessionStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionState & SessionActions>>;
export {};
