import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions';
/**
 * Represents a musical achievement unlocked by the user.
 *
 * @public
 */
export interface Achievement {
    /** Unique identifier for the achievement (e.g., 'first-perfect-scale'). */
    id: string;
    /** Human-readable display name. */
    name: string;
    /** Detailed description of the accomplishment required to unlock it. */
    description: string;
    /** Icon or emoji representation of the achievement. */
    icon: string;
    /** Unix timestamp when the achievement was first unlocked. */
    unlockedAtMs: number;
}
/**
 * State structure for the achievements store.
 */
interface AchievementsState {
    /** Persistence schema version for migrations. */
    schemaVersion: 1;
    /** List of all permanently unlocked achievements. */
    unlocked: Achievement[];
    /** Queue of achievements that have been unlocked but not yet acknowledged by the user in UI. */
    pending: Achievement[];
}
/**
 * Actions for managing the achievement lifecycle.
 */
interface AchievementsActions {
    /**
     * Checks current practice metrics against defined achievement criteria.
     *
     * @remarks
     * This method uses the `checkAchievements` domain logic and updates the store
     * with any new milestones reached.
     *
     * @param stats - Current practice and progress metrics.
     * @returns Array of newly unlocked achievements in this check cycle.
     */
    check: (stats: AchievementCheckStats) => Achievement[];
    /**
     * Removes an achievement from the pending queue after it has been displayed to the user.
     *
     * @param id - ID of the achievement to acknowledge.
     */
    markShown: (id: string) => void;
}
/**
 * Zustand store for managing the persistent achievement system.
 *
 * @remarks
 * This store coordinates the detection and persistence of user milestones.
 * Key responsibilities:
 * - **Achievement Detection**: Leverages pure domain logic to evaluate user performance.
 * - **UI Notification Queue**: Manages a `pending` list for "toast" style notifications.
 * - **Persistence**: Ensures achievements are saved across sessions using Zod-validated persistence.
 *
 * @public
 */
export declare const useAchievementsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AchievementsState & AchievementsActions>>;
export {};
