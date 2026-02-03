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
export declare const useAchievementsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AchievementsState & AchievementsActions>>;
export {};
