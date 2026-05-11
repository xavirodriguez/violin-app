import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAnalyticsStore } from './analytics-store'
import { useCurriculumStore } from './curriculum-store'
import { LearningObjective } from '@/lib/domain/curriculum'

export interface ObjectiveMastery {
  objectiveId: string
  mastery: number // 0.0 - 1.0
  trend: 'up' | 'down' | 'stable'
  lastPracticedMs: number
}

interface MasteryStore {
  objectiveMastery: Record<string, ObjectiveMastery>
  calculateMastery: () => void
}

export const useMasteryStore = create<MasteryStore>()(
  persist(
    (set, get) => ({
      objectiveMastery: {},

      calculateMastery: () => {
        const analyticsStore = useAnalyticsStore.getState()
        const curriculumStore = useCurriculumStore.getState()
        const { exerciseStats } = analyticsStore.progress
        const { units } = curriculumStore

        const newMastery: Record<string, ObjectiveMastery> = {}

        // Iterate through all learning objectives in all units
        units.forEach(unit => {
          unit.learningObjectives.forEach(objective => {
            // Find exercises that teach this objective
            // In our current simple model, we check if exerciseId of any lesson in the unit
            // (Note: in a more complex model, objective might be linked to multiple exercises directly)

            const relevantExercises = unit.lessons.map(l => l.exerciseId)
            let totalAccuracy = 0
            let count = 0
            let lastPracticed = 0

            relevantExercises.forEach(id => {
              const stats = exerciseStats[id]
              if (stats) {
                totalAccuracy += stats.averageAccuracy
                count++
                lastPracticed = Math.max(lastPracticed, stats.lastPracticedMs)
              }
            })

            const mastery = count > 0 ? (totalAccuracy / count) / 100 : 0

            // For trend, we would compare with previous mastery, but for now 'stable'
            const prev = get().objectiveMastery[objective.id]
            const trend = !prev ? 'stable' : mastery > prev.mastery ? 'up' : mastery < prev.mastery ? 'down' : 'stable'

            newMastery[objective.id] = {
              objectiveId: objective.id,
              mastery,
              trend,
              lastPracticedMs: lastPracticed
            }
          })
        })

        set({ objectiveMastery: newMastery })
      }
    }),
    {
      name: 'violin-mastery-storage',
    }
  )
)
