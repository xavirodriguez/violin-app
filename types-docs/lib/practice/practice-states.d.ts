import { PracticeState } from '../practice-core';
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import { Exercise } from '../exercises/types';
import { AppError } from '../errors/app-error';
import { PracticeSessionRunner } from './session-runner';
/**
 * Estados del Practice Store como Discriminated Union
 * Elimina estados inválidos (ej: isStarting=true pero runner=null)
 */
export type PracticeStoreState = IdleState | InitializingState | ReadyState | ActiveState | ErrorState;
export interface IdleState {
    status: 'idle';
    exercise: Exercise | null;
    error: null;
}
export interface InitializingState {
    status: 'initializing';
    exercise: Exercise | null;
    progress: number;
}
export interface ReadyState {
    status: 'ready';
    audioLoop: AudioLoopPort;
    detector: PitchDetectionPort;
    exercise: Exercise;
}
export interface ActiveState {
    status: 'active';
    audioLoop: AudioLoopPort;
    detector: PitchDetectionPort;
    exercise: Exercise;
    runner: PracticeSessionRunner;
    practiceState: PracticeState;
}
export interface ErrorState {
    status: 'error';
    error: AppError;
}
/**
 * Transiciones permitidas
 */
export declare const transitions: {
    initialize: (exercise: Exercise | null) => InitializingState;
    ready: (resources: {
        audioLoop: AudioLoopPort;
        detector: PitchDetectionPort;
        exercise: Exercise;
    }) => ReadyState;
    start: (state: ReadyState, runner: PracticeSessionRunner) => ActiveState;
    stop: (state: ActiveState) => ReadyState;
    error: (error: AppError) => ErrorState;
    reset: () => IdleState;
    selectExercise: (exercise: Exercise) => IdleState;
};
