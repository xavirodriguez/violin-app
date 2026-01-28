import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
/**
 * A type representing the core state management functions of a Zustand store.
 */
type StoreApi<T> = {
    getState: () => T;
    setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean | any) => void;
};
/**
 * Handles all state transitions and side effects for a given practice event.
 */
export declare const handlePracticeEvent: (event: PracticeEvent, store: StoreApi<{
    practiceState: PracticeState | null;
}>, onCompleted: () => void) => void;
export {};
