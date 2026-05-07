import { CompletedPracticeSession } from '@/lib/domain/practice';
/**
 * Internal state for the session history store.
 */
interface SessionHistoryState {
    /** Array of completed practice sessions, capped at 100. */
    sessions: CompletedPracticeSession[];
}
/**
 * Actions for managing session history.
 */
interface SessionHistoryActions {
    /**
     * Adds a completed session to the history.
     *
     * @param session - The session to add.
     */
    addSession: (session: CompletedPracticeSession) => void;
    /**
     * Retrieves sessions filtered by age.
     *
     * @param days - Number of days to look back.
     * @returns Filtered array of {@link CompletedPracticeSession}.
     */
    getHistory: (days?: number) => CompletedPracticeSession[];
}
/**
 * Zustand store for persisting and retrieving practice session history.
 *
 * @remarks
 * This store provides a simple persistent log of recent practice activity.
 * It uses `validatedPersist` to ensure data integrity.
 *
 * @public
 */
export declare const useSessionHistoryStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionHistoryState & SessionHistoryActions>>;
export {};
