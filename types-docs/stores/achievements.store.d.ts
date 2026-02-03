import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions';
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAtMs: number;
}
interface AchievementsState {
    schemaVersion: 1;
    unlocked: Achievement[];
    pending: Achievement[];
}
interface AchievementsActions {
    check: (stats: AchievementCheckStats) => Achievement[];
    markShown: (id: string) => void;
}
export declare const useAchievementsStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AchievementsState & AchievementsActions>, "setState" | "persist"> & {
    setState(partial: (AchievementsState & AchievementsActions) | Partial<AchievementsState & AchievementsActions> | ((state: AchievementsState & AchievementsActions) => (AchievementsState & AchievementsActions) | Partial<AchievementsState & AchievementsActions>), replace?: false | undefined): unknown;
    setState(state: (AchievementsState & AchievementsActions) | ((state: AchievementsState & AchievementsActions) => AchievementsState & AchievementsActions), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AchievementsState & AchievementsActions, AchievementsState & AchievementsActions, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AchievementsState & AchievementsActions) => void) => () => void;
        onFinishHydration: (fn: (state: AchievementsState & AchievementsActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AchievementsState & AchievementsActions, AchievementsState & AchievementsActions, unknown>>;
    };
}>;
export {};
