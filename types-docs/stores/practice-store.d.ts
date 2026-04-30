/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing the lifecycle from exercise
 * selection to completion. It coordinates audio resources, real-time analysis,
 * and persistent progress tracking.
 */
import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
import { AppError } from '@/lib/errors/app-error';
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port';
import { PracticeStoreState } from '@/lib/practice/practice-states';
import type { Exercise } from '@/lib/exercises/types';
import { Observation } from '@/lib/technique-types';
/**
 * Main store for managing the practice mode lifecycle and real-time audio pipeline.
 */
export interface PracticeStore {
    state: PracticeStoreState;
    practiceState: PracticeState | undefined;
    error: AppError | undefined;
    liveObservations: Observation[];
    autoStartEnabled: boolean;
    analyser: AnalyserNode | undefined;
    audioLoop: AudioLoopPort | undefined;
    detector: PitchDetectionPort | undefined;
    isStarting: boolean;
    isInitializing: boolean;
    sessionToken: string | undefined;
    sessionId: number;
    loadExercise: (exercise: Exercise) => Promise<void>;
    setAutoStart: (enabled: boolean) => void;
    setNoteIndex: (index: number) => void;
    initializeAudio: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => Promise<void>;
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
}
type SafeUpdate = Pick<PracticeStore, 'practiceState' | 'liveObservations' | 'error'>;
type SafePartial = SafeUpdate | Partial<SafeUpdate> | ((s: PracticeStore) => Partial<SafeUpdate>);
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
/**
 * Creates a safe state update function for the practice session.
 * @internal
 */
export declare function createSafeSet(params: {
    set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void;
    get: () => PracticeStore;
    currentToken: string;
}): (partial: SafePartial) => void;
/** @internal */
export declare function calculateCentsTolerance(): number;
export {};
