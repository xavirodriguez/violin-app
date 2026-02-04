import { create } from 'zustand'
import { checkAchievements } from '@/lib/achievements/achievement-checker'
import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { createMigrator } from '@/lib/persistence/migrator'
import { AchievementsStateSchema } from '@/lib/schemas/persistence.schema'

/**
 * Represents a musical achievement unlocked by the user.
 *
 * @public
 */
export interface Achievement {
  /** Unique identifier for the achievement. */
  id: string
  /** Human-readable display name. */
  name: string
  /** Description of the accomplishment. */
  description: string
  /** Icon or emoji representing the achievement. */
  icon: string
  /** Unix timestamp when the achievement was unlocked. */
  unlockedAtMs: number
}

/**
 * State structure for the achievements store.
 */
interface AchievementsState {
  /** Persistence schema version. */
  schemaVersion: 1
  /** List of all unlocked achievements. */
  unlocked: Achievement[]
  /** List of achievements that have been unlocked but not yet acknowledged by the user. */
  pending: Achievement[]
}

/**
 * Actions for managing achievements.
 */
interface AchievementsActions {
  /**
   * Checks current statistics against achievement criteria.
   *
   * @param stats - Current practice and progress metrics.
   * @returns Array of newly unlocked achievements.
   */
  check: (stats: AchievementCheckStats) => Achievement[]

  /**
   * Clears an achievement from the pending queue.
   *
   * @param id - ID of the achievement.
   */
  markShown: (id: string) => void
}

/**
 * Zustand store for managing the achievement system.
 *
 * @remarks
 * This store handles the persistence and state of user achievements. It separates
 * achievements into "unlocked" (permanent history) and "pending" (queued for UI notification).
 *
 * It uses `validatedPersist` to ensure the stored data matches the expected schema.
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
