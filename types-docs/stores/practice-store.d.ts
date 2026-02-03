/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing:
 * 1. FSM (State Machine) for the practice flow.
 * 2. Audio resources (Web Audio, Pitch Detection).
 * 3. Asynchronous runner loop.
 * 4. Analytics and progress tracking.
 *
 * Refactored to handle:
 * - Concurrency: Guards against double start and stale updates using sessionId.
 * - Resource Lifecycle: Resource-first cleanup in stop() to prevent leaks.
 * - Reactivity: analyser and detector are stored in state for UI consistency.
 */
import { AppError } from '@/lib/errors/app-error';
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port';
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
    analyser: AnalyserNode | null;
    audioLoop: AudioLoopPort | null;
    detector: PitchDetectionPort | null;
    isStarting: boolean;
    sessionId: number;
    analyser: AnalyserNode | null;
    detector: PitchDetectionPort | null;
    loadExercise: (exercise: Exercise) => Promise<void>;
    setAutoStart: (enabled: boolean) => void;
    setNoteIndex: (index: number) => void;
    initializeAudio: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => Promise<void>;
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
}
export declare const usePracticeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PracticeStore>>;
export {};
