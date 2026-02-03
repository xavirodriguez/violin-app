import { type PracticeState } from '@/lib/practice-core';
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import type { Exercise } from '@/lib/exercises/types';
import { NoteTechnique } from '../technique-types';
export interface SessionResult {
    completed: boolean;
    reason: 'finished' | 'cancelled' | 'error';
    error?: Error;
}
export interface PracticeSessionRunner {
    run(signal: AbortSignal): Promise<SessionResult>;
    cancel(): void;
}
export interface SessionRunnerDependencies {
    audioLoop: AudioLoopPort;
    detector: PitchDetectionPort;
    exercise: Exercise;
    sessionStartTime: number;
    store: {
        getState: () => {
            practiceState: PracticeState | null;
            liveObservations?: any[];
        };
        setState: (partial: {
            practiceState: PracticeState | null;
            liveObservations?: any[];
        } | Partial<{
            practiceState: PracticeState | null;
            liveObservations?: any[];
        }> | ((state: {
            practiceState: PracticeState | null;
            liveObservations?: any[];
        }) => {
            practiceState: PracticeState | null;
            liveObservations?: any[];
        } | Partial<{
            practiceState: PracticeState | null;
            liveObservations?: any[];
        }>), replace?: boolean) => void;
        stop: () => Promise<void>;
    };
    analytics: {
        endSession: () => void;
        recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void;
        recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void;
    };
    updatePitch?: (pitch: number, confidence: number) => void;
}
export declare class PracticeSessionRunnerImpl implements PracticeSessionRunner {
    private deps;
    private controller;
    private loopState;
    constructor(deps: SessionRunnerDependencies);
    run(signal: AbortSignal): Promise<SessionResult>;
    cancel(): void;
    private cleanup;
    private runInternal;
    private mapEngineEventToPracticeEvent;
    private processEvent;
    private handleMatchedNoteSideEffects;
}
/**
 * @deprecated Use PracticeSessionRunnerImpl directly
 */
export declare function runPracticeSession(deps: SessionRunnerDependencies): Promise<SessionResult>;
