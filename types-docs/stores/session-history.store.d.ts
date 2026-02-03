import { PracticeSession } from './session.store';
interface SessionHistoryState {
    sessions: PracticeSession[];
}
interface SessionHistoryActions {
    addSession: (session: PracticeSession) => void;
    getHistory: (days?: number) => PracticeSession[];
}
export declare const useSessionHistoryStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SessionHistoryState & SessionHistoryActions>>;
export {};
