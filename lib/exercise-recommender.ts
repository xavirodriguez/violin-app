import type { Exercise, Difficulty } from '@/lib/domain/musical-types'
import type { AnalyticsStore } from '@/stores/analytics-store'

/** Shorthand for user progress from the Analytics store. */
type UserProgress = AnalyticsStore['progress']

/**
 * Pedagogical exercise recommender logic.
 *
 * @remarks
 * This function implements a heuristic-based recommendation engine designed to optimize
 * the student's learning path. It follows several rules:
 *
 * 1. **Persistence**: If the last exercise played had low accuracy (`< 80%`) and was played recently,
 *    it recommends playing it again.
 * 2. **Review**: Finds exercises previously completed with very low accuracy (`< 70%`) and
 *    suggests an easier version in the same category (or the same one if already beginner).
 * 3. **Progression**: If all exercises in the current difficulty are completed, it moves
 *    to the next difficulty level.
 * 4. **Discovery**: Suggests the first unplayed exercise in the current target difficulty.
 * 5. **Spaced Repetition**: Suggests exercises not played today.
 *
 * @param exercises - All available exercises in the system.
 * @param userProgress - The user's historical performance data.
 * @param lastPlayedId - Optional ID of the exercise played just before this request.
 * @returns The recommended {@link Exercise}, or the first available one if no specific recommendation is found.
 *
 * @public
 */
export function getRecommendedExercise(
  exercises: Exercise[],
  userProgress: UserProgress,
  lastPlayedId?: string
): Exercise | null {
  const { exerciseStats } = userProgress
  const now = Date.now()
  const DAY_MS = 86_400_000

  // Rule 1: persistence on failure
  if (lastPlayedId) {
    const lastStats = exerciseStats[lastPlayedId]
    if (lastStats && now - lastStats.lastPracticedMs < DAY_MS && lastStats.bestAccuracy < 80) {
      const exercise = exercises.find(ex => ex.id === lastPlayedId)
      if (exercise) return exercise
    }
  }

  // Rule 2: review low accuracy (with possible difficulty step down)
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

  // Rule 3 & 4: progression and discovery
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

  // Rule 5: spaced repetition (not played today)
  const notPlayedToday = exercises.find(ex => {
    const stats = exerciseStats[ex.id]
    return !stats || now - stats.lastPracticedMs > DAY_MS
  })

  return notPlayedToday ?? exercises[0] ?? null
}

/**
 * Compares two difficulty levels to see if the first is easier than the second.
 *
 * @param a - First difficulty.
 * @param b - Second difficulty.
 * @internal
 */
function isEasier(a: Difficulty, b: Difficulty): boolean {
  const order: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
  return order.indexOf(a) < order.indexOf(b)
}
