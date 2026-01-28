/**
 * PracticeStore
 *
 * This module provides a Zustand store for managing the state of a violin practice session.
 * It handles exercise loading, audio resource management, and the real-time pitch detection loop.
 */
import { type PracticeState } from '@/lib/practice-core';
import { PitchDetector } from '@/lib/pitch-detector';
import type { Exercise } from '@/lib/exercises/types';
/**
 * Interface representing the state and actions of the practice store.
 */
interface PracticeStore {
    practiceState: PracticeState | null;
    error: string | null;
    currentNoteIndex: number;
    targetNote: Exercise['notes'][0] | null;
    status: PracticeState['status'];
    analyser: AnalyserNode | null;
    detector: PitchDetector | null;
    loadExercise: (exercise: Exercise) => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => Promise<void>;
}
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
export {};
