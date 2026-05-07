export interface ObjectiveMastery {
    objectiveId: string;
    mastery: number;
    trend: 'up' | 'down' | 'stable';
    lastPracticedMs: number;
}
interface MasteryStore {
    objectiveMastery: Record<string, ObjectiveMastery>;
    calculateMastery: () => void;
}
export declare const useMasteryStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<MasteryStore>, "setState" | "persist"> & {
    setState(partial: MasteryStore | Partial<MasteryStore> | ((state: MasteryStore) => MasteryStore | Partial<MasteryStore>), replace?: false | undefined): unknown;
    setState(state: MasteryStore | ((state: MasteryStore) => MasteryStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<MasteryStore, MasteryStore, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: MasteryStore) => void) => () => void;
        onFinishHydration: (fn: (state: MasteryStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<MasteryStore, MasteryStore, unknown>>;
    };
}>;
export {};
