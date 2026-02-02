import { create } from 'zustand'
import { checkAchievements } from '@/lib/achievements/achievement-checker'
import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { AchievementsStateSchema } from '@/lib/schemas/persistence.schema'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAtMs: number
}

interface AchievementsState {
  unlocked: Achievement[]
  pending: Achievement[]
}

interface AchievementsActions {
  check: (stats: AchievementCheckStats) => Achievement[]
  markShown: (id: string) => void
}

export const useAchievementsStore = create<AchievementsState & AchievementsActions>()(
  validatedPersist(
    AchievementsStateSchema as any,
    (set, get) => ({
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
      name: 'violin-achievements'
    }
  )
)
