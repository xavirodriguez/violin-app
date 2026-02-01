import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 */
type StoreApi<T> = {
    getState: () => T;
    setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: false) => void;
};
/**
 * Handles all state transitions and side effects for a given practice event.
 */
export declare const handlePracticeEvent: <T extends {
    practiceState: PracticeState | null;
}>(event: PracticeEvent, store: StoreApi<T>, onCompleted: () => void, analytics?: {
    endSession: () => void;
}) => void;
export {};
