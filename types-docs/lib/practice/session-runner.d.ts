import { type PracticeState } from '@/lib/practice-core';
import type { PitchDetector } from '@/lib/pitch-detector';
import type { Exercise } from '@/lib/exercises/types';
import { NoteTechnique } from '../technique-types';
interface SessionState {
    practiceState: PracticeState | null;
    analyser: AnalyserNode | null;
}
interface SessionRunnerDependencies {
    signal: AbortSignal;
    sessionId: number;
    store: {
        getState: () => SessionState;
        setState: (partial: SessionState | Partial<SessionState> | ((state: SessionState) => Partial<SessionState>), replace?: false) => void;
        stop: () => Promise<void>;
    };
    analytics: {
        recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void;
        recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void;
        endSession: () => void;
    };
    updatePitch?: (pitch: number, confidence: number) => void;
    detector: PitchDetector;
    exercise: Exercise;
    sessionStartTime: number;
}
/**
 * Runs the asynchronous practice loop, processing audio events and updating the store.
 *
 * @remarks
 * This function is decoupled from the Zustand store's internal structure,
 * relying instead on a minimal dependency interface. This allows for better
 * testability and prevents closure-related memory leaks or race conditions.
 */
export declare function runPracticeSession(deps: SessionRunnerDependencies): Promise<void>;
export {};
