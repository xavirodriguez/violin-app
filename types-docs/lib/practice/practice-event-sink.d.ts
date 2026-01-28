import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
/**
 * A type representing the core state management functions of a Zustand store.
 *
 * @template T - The type of the state managed by the store.
 */
type StoreApi<T> = {
    getState: () => T;
    setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void;
};
/**
 * Handles all state transitions and side effects for a given practice event.
 *
 * @remarks
 * This function acts as a centralized sink for all events originating from the
 * practice pipeline. It orchestrates the process of:
 * 1.  Reducing the current state based on the event to get the new, pure state.
 * 2.  Committing the new state to the Zustand store.
 * 3.  Triggering any necessary side effects (e.g., analytics) in a safe manner.
 *
 * This decouples the core practice loop from the application's side effect concerns,
 * making the system more modular and easier to test. It also provides a single
 * point for error handling and logging related to event processing.
 *
 * @param event - The `PracticeEvent` to be processed.
 * @param store - The Zustand store API (`{ getState, setState }`) for the practice store.
 * @param onCompleted - A callback to be invoked when the exercise is completed.
 */
export declare const handlePracticeEvent: (event: PracticeEvent, store: StoreApi<{
    practiceState: PracticeState | null;
}>, onCompleted: () => void) => void;
export {};
