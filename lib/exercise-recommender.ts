import type { Exercise, Difficulty } from '@/lib/domain/musical-types'
import type { AnalyticsStore } from '@/stores/analytics-store'

type UserProgress = AnalyticsStore['progress']

export function getRecommendedExercise(
  exercises: Exercise[],
  userProgress: UserProgress,
  lastPlayedId?: string
): Exercise | null {
  const { exerciseStats } = userProgress
  const now = Date.now()
  const DAY_MS = 86_400_000

  if (lastPlayedId) {
    const lastStats = exerciseStats[lastPlayedId]
    if (lastStats && now - lastStats.lastPracticedMs < DAY_MS && lastStats.bestAccuracy < 80) {
      const exercise = exercises.find(ex => ex.id === lastPlayedId)
      if (exercise) return exercise
    }
  }

  const lowAccuracyExerciseId = Object.keys(exerciseStats).find(id => {
    const stats = exerciseStats[id]
    return stats.bestAccuracy < 70 && stats.timesCompleted > 0
  })

  if (lowAccuracyExerciseId) {
    const exercise = exercises.find(ex => ex.id === lowAccuracyExerciseId)
    if (exercise) {
      if (exercise.difficulty === 'Beginner') return exercise
      const easier = exercises.find(ex =>
        ex.category === exercise.category &&
        isEasier(ex.difficulty, exercise.difficulty)
      )
      if (easier) return easier
      return exercise
    }
  }

  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
  let currentDifficulty: Difficulty = 'Beginner'

  for (const diff of difficulties) {
    const exercisesInDiff = exercises.filter(ex => ex.difficulty === diff)
    const allCompleted = exercisesInDiff.every(ex => (exerciseStats[ex.id]?.timesCompleted ?? 0) > 0)
    if (allCompleted) {
      const nextIdx = difficulties.indexOf(diff) + 1
      if (nextIdx < difficulties.length) currentDifficulty = difficulties[nextIdx]
      else currentDifficulty = diff
    } else {
      currentDifficulty = diff
      break
    }
  }

  const unplayedInDifficulty = exercises.find(ex =>
    ex.difficulty === currentDifficulty &&
    (exerciseStats[ex.id]?.timesCompleted ?? 0) === 0
  )

  if (unplayedInDifficulty) return unplayedInDifficulty

  const notPlayedToday = exercises.find(ex => {
    const stats = exerciseStats[ex.id]
    return !stats || now - stats.lastPracticedMs > DAY_MS
  })

  return notPlayedToday ?? exercises[0] ?? null
}

function isEasier(a: Difficulty, b: Difficulty): boolean {
  const order: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
  return order.indexOf(a) < order.indexOf(b)
}
