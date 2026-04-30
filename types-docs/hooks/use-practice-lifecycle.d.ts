/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */
import { PracticeState } from '@/lib/practice-core';
import { useOSMDSafe } from './use-osmd-safe';
import { Exercise } from '@/lib/exercises/types';
import { DerivedPracticeState } from '@/lib/practice/practice-utils';
interface LifecycleParams {
    practiceState: PracticeState | undefined;
    loadExercise: (exercise: Exercise) => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    setIsZen: (enabled: boolean | ((prev: boolean) => boolean)) => void;
    osmdHook: ReturnType<typeof useOSMDSafe>;
    derived: DerivedPracticeState;
    autoStartEnabled: boolean;
    lastLoadedAt: number;
}
export declare function usePracticeLifecycle(params: LifecycleParams): void;
export {};
