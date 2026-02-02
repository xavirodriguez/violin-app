import { PracticeSession } from './session.store';
interface SessionHistoryState {
    sessions: PracticeSession[];
}
interface SessionHistoryActions {
    addSession: (session: PracticeSession) => void;
    getHistory: (days?: number) => PracticeSession[];
}
export declare const useSessionHistoryStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<SessionHistoryState & SessionHistoryActions>, "setState" | "persist"> & {
    setState(partial: (SessionHistoryState & SessionHistoryActions) | Partial<SessionHistoryState & SessionHistoryActions> | ((state: SessionHistoryState & SessionHistoryActions) => (SessionHistoryState & SessionHistoryActions) | Partial<SessionHistoryState & SessionHistoryActions>), replace?: false | undefined): unknown;
    setState(state: (SessionHistoryState & SessionHistoryActions) | ((state: SessionHistoryState & SessionHistoryActions) => SessionHistoryState & SessionHistoryActions), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<SessionHistoryState & SessionHistoryActions, SessionHistoryState & SessionHistoryActions, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: SessionHistoryState & SessionHistoryActions) => void) => () => void;
        onFinishHydration: (fn: (state: SessionHistoryState & SessionHistoryActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<SessionHistoryState & SessionHistoryActions, SessionHistoryState & SessionHistoryActions, unknown>>;
    };
}>;
export {};
