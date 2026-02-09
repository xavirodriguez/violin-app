import { type PracticeState, type PracticeEvent } from '@/lib/practice-core';
/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 */
type StoreApi<T> = {
    /** Retrieves the current state from the store. */
    getState: () => T;
    /**
     * Updates the store state using a partial update or an updater function.
     *
     * @param partial - The new state or a function that returns the new state.
     * @param replace - If true, replaces the entire state instead of merging.
     */
    setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void;
};
/**
 * Handles state transitions and side effects for practice events emitted by the audio pipeline.
 *
 * @remarks
 * This function acts as the "event sink" that bridge the gap between the event-driven
 * audio pipeline and the reactive Zustand stores. It ensures that:
 * 1. **Pure State Transitions**: Performed via the `reducePracticeEvent` reducer.
 * 2. **Side Effect Detection**: Detects transitions to 'completed' and triggers callbacks.
 * 3. **Error Resilience**: Implements defensive guards against null states or invalid events.
 *
 * @param event - The practice event to process.
 * @param store - The Zustand store API to update.
 * @param onCompleted - Callback triggered when the exercise is successfully completed.
 * @param analytics - Optional analytics handlers for session finalization.
 *
 * @public
 */
export declare const handlePracticeEvent: <T extends {
    practiceState: PracticeState | null;
}>(event: PracticeEvent, store: StoreApi<T>, onCompleted: () => void, analytics?: {
    endSession: () => void;
}) => void;
export {};
