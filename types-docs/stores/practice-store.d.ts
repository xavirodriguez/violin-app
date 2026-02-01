/**
 * PracticeStore
 *
 * Managing the state of a violin practice session, including audio resources
 * and the real-time event pipeline consumption.
 */
import { type PracticeState } from '@/lib/practice-core';
import { PitchDetector } from '@/lib/pitch-detector';
import { AppError } from '@/lib/errors/app-error';
import type { Exercise } from '@/lib/exercises/types';
import type { PracticeEvent } from '@/lib/practice-core';
import type { Observation } from '@/lib/technique-types';
interface PracticeStore {
    practiceState: PracticeState | null;
    analyser: AnalyserNode | null;
    detector: PitchDetector | null;
    error: AppError | null;
    liveObservations: Observation[];
    isStarting: boolean;
    sessionId: number;
    loadExercise: (exercise: Exercise) => void;
    start: () => Promise<void>;
    stop: () => void;
    reset: () => void;
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
    initializeAudio: () => Promise<void>;
}
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
export {};
