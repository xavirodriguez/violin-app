import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions';
import { Achievement } from '@/lib/domain/practice';
/**
 * State structure for the achievements store.
 *
 * @internal
 */
interface AchievementsState {
    /** Version of the persistence schema for automated migrations. */
    schemaVersion: 1;
    /** List of all permanently unlocked achievements in the user's history. */
    unlocked: Achievement[];
    /** Queue of achievements that have been unlocked but not yet acknowledged (toasted) in the UI. */
    pending: Achievement[];
}
/**
 * Actions for managing the achievement lifecycle and state transitions.
 *
 * @public
 */
interface AchievementsActions {
    /**
     * Checks current practice metrics against the global achievement library.
     *
     * @remarks
     * **Workflow**:
     * 1. **Evaluation**: Delegates to the pure `checkAchievements` domain logic
     *    to identify milestones met by the provided `stats`.
     * 2. **Deduplication**: Filters out milestones that have already been unlocked
     *    in previous sessions.
     * 3. **Persistence**: Updates the `unlocked` list with the new achievements.
     * 4. **Notification**: Adds the new achievements to the `pending` queue to
     *    ensure they are toasted in the UI.
     *
     * @param stats - Current practice performance and long-term progress metrics.
     * @returns Array of newly unlocked achievements in this specific check cycle.
     */
    check: (stats: AchievementCheckStats) => Achievement[];
    /**
     * Removes an achievement from the `pending` queue.
     *
     * @remarks
     * **UI Synchronization**:
     * This method should be called once the UI (e.g., a `sonner` toast or
     * `canvas-confetti` animation) has successfully acknowledged the achievement.
     * It prevents the same milestone from being announced multiple times
     * upon app reload or navigation.
     *
     * @param id - The unique ID of the achievement to acknowledge.
     */
    markShown: (id: string) => void;
}
/**
 * Zustand store for managing the persistent achievement system.
 *
 * @remarks
 * This store handles the "Gamification" layer of the application. It is decoupled
 * from the core practice engine to ensure that achievement logic doesn't block
 * the audio processing pipeline.
 *
 * **Architecture**:
 * - **Validation**: Uses Zod-based persistence (`validatedPersist`) to ensure
 *   milestone data is never corrupted.
 * - **Notification Queue**: Implements a `pending` queue to ensure that no
 *   achievement notification is missed, even if multiple are unlocked simultaneously.
 * - **Domain Delegation**: Delegates the actual "Check" logic to the pure
 *   `achievement-checker` module for better testability.
 *
 * @example
 * ```ts
 * const { unlocked, check } = useAchievementsStore();
 * ```
 *
 * @public
 */
export declare const useAchievementsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AchievementsState & AchievementsActions>>;
export {};
