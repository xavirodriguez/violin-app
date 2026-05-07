/**
 * Helper functions for the PracticeStore to keep the main store file clean.
 */
import { type PracticeState, type PracticeEvent } from '@/lib/domain/practice';
import { ReadyState, PracticeStoreState } from '@/lib/practice/practice-states';
import type { Exercise } from '@/lib/domain/exercise';
import { Observation } from '@/lib/technique-types';
import { PracticeStore } from './practice-store';
/**
 * Returns the initial domain state for a new practice session.
 */
export declare function getInitialPracticeState(exercise: Exercise): PracticeState;
/**
 * Extracts live observations from the current practice state.
 */
export declare function getUpdatedLiveObservations(state: PracticeState): Observation[];
/**
 * Orchestrates domain state updates using the pure practice reducer.
 */
export declare function updatePracticeState(state: PracticeState | undefined, event: PracticeEvent): PracticeState | undefined;
/**
 * Ensures the store is in a 'ready' state, initializing audio if necessary.
 */
export declare function ensureReadyState(params: {
    getState: () => {
        state: PracticeStoreState;
    };
    initializeAudio: () => Promise<void>;
}): Promise<ReadyState | undefined>;
/**
 * Handles terminal failures in the session runner.
 */
export declare function handleRunnerFailure(params: {
    set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void;
    get: () => {
        state: PracticeStoreState;
    };
    err: unknown;
    exercise: Exercise;
}): void;
