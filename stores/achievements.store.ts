import { create } from 'zustand'
import { checkAchievements } from '@/lib/achievements/achievement-checker'
import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { createMigrator } from '@/lib/persistence/migrator'
import { AchievementsStateSchema } from '@/lib/schemas/persistence.schema'

/**
 * Represents a musical achievement or milestone unlocked by the user.
 *
 * @remarks
 * This model is used to reward consistency, accuracy, and technical growth.
 *
 * @public
 */
export interface Achievement {
  /**
   * Unique identifier for the achievement (e.g., 'first-perfect-scale').
   * Used as a key for translations and UI rendering.
   */
  id: string
  /** Human-readable display name. */
  name: string
  /** Detailed description of the accomplishment required to unlock this achievement. */
  description: string
  /** Icon or emoji representation for visual feedback. */
  icon: string
  /** Unix timestamp of the exact moment the achievement was first unlocked. */
  unlockedAtMs: number
}

/**
 * State structure for the achievements store.
 *
 * @internal
 */
interface AchievementsState {
  /** Version of the persistence schema for automated migrations. */
  schemaVersion: 1
  /** List of all permanently unlocked achievements in the user's history. */
  unlocked: Achievement[]
  /** Queue of achievements that have been unlocked but not yet acknowledged (toasted) in the UI. */
  pending: Achievement[]
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
  check: (stats: AchievementCheckStats) => Achievement[]

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
  markShown: (id: string) => void
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
export const useAchievementsStore = create<AchievementsState & AchievementsActions>()(
  validatedPersist(
    AchievementsStateSchema as any,
    (set, get) => ({
      schemaVersion: 1,
      unlocked: [],
      pending: [],

      check: (stats) => {
        const unlockedIds = get().unlocked.map(a => a.id)
        const newAchievements = checkAchievements(stats, unlockedIds)

        if (newAchievements.length > 0) {
          set(state => ({
            unlocked: [...state.unlocked, ...newAchievements],
            pending: [...state.pending, ...newAchievements]
          }))
        }

        return newAchievements
      },

      markShown: (id) => {
        set(state => ({
          pending: state.pending.filter(a => a.id !== id)
        }))
      }
    }),
    {
      name: 'violin-achievements',
      version: 1,
      migrate: createMigrator({
        1: (state: any) => ({
          ...state,
          schemaVersion: 1
        })
      })
    }
  )
)
