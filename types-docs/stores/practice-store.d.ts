/**
 * PracticeStore
 *
 * Managing the state of a violin practice session using explicit states.
 */
import { AppError } from '@/lib/errors/app-error';
import { PracticeStoreState } from '@/lib/practice/practice-states';
import type { Exercise } from '@/lib/exercises/types';
import { Observation } from '@/lib/technique-types';
import { PracticeState, PracticeEvent } from '@/lib/practice-core';
interface PracticeStore {
    state: PracticeStoreState;
    practiceState: PracticeState | null;
    error: AppError | null;
    liveObservations: Observation[];
    autoStartEnabled: boolean;
    loadExercise: (exercise: Exercise) => Promise<void>;
    setAutoStart: (enabled: boolean) => void;
    setNoteIndex: (index: number) => void;
    initializeAudio: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => void;
    reset: () => void;
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
    initializeAudio: () => Promise<void>;
}
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
export {};
