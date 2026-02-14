import type { Exercise, Difficulty } from '@/lib/domain/musical-types'
import type { AnalyticsStore } from '@/stores/analytics-store'

/** Shorthand for user progress from the Analytics store. */
type UserProgress = AnalyticsStore['progress']

/**
 * Pedagogical exercise recommender engine.
 *
 * @remarks
 * This function implements a heuristic-based logic designed to optimize
 * the student's learning path based on historical performance. It acts as
 * an automated tutor, ensuring the student is neither bored nor overwhelmed.
 *
 * **Recommendation Rules (in order of priority)**:
 * 1. **Persistence on Failure**: If the last exercise played had low accuracy (`< 80%`) and was attempted today, suggest trying it again to build muscle memory.
 * 2. **Review with Regression**: If a completed exercise has low accuracy (`< 70%`), suggest an easier exercise in the same category to reinforce fundamentals.
 * 3. **Progression**: If all exercises in the current difficulty are mastered, suggest the first exercise of the next level.
 * 4. **Discovery**: Suggest the first unplayed exercise in the current target difficulty.
 * 5. **Spaced Repetition**: Fallback to the oldest practiced exercise that wasn't played today.
 *
 * @param exercises - Array of all available exercises in the library.
 * @param userProgress - The user's historical progress, including attempt counts and best scores.
 * @param lastPlayedId - ID of the exercise practiced in the previous session for continuity.
 * @returns The recommended {@link Exercise}, or the first available one as a fallback. Returns `null` if the library is empty.
 *
 * @example
 * ```ts
 * const rec = getRecommendedExercise(allExercises, progress, lastId);
 * if (rec) console.log(`We recommend: ${rec.name}`);
 * ```
 *
 * @example
 * ```ts
 * const nextExercise = getRecommendedExercise(allExercises, progress, "scale_c_major");
 * console.log(`Recommended: ${nextExercise.name}`);
 * ```
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

  // Rule 1: Persistence on failure
  // If the user recently failed to reach a mastery threshold (80%),
  // we encourage immediate re-attempt while the technical challenge
  // is still fresh in their mind.
  if (lastPlayedId) {
    const lastStats = exerciseStats[lastPlayedId]
    if (lastStats && now - lastStats.lastPracticedMs < DAY_MS && lastStats.bestAccuracy < 80) {
      const exercise = exercises.find(ex => ex.id === lastPlayedId)
      if (exercise) return exercise
    }
  }

  // Rule 2: Review low accuracy (with possible difficulty step down)
  // If historical accuracy is poor (< 70%), we suggest dropping down
  // one difficulty level within the same category to reinforce
  // prerequisite technical skills.
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
 * Compares two difficulty levels to determine if the first is easier than the second.
 *
 * @param a - The candidate easier difficulty.
 * @param b - The reference harder difficulty.
 * @returns True if `a` is strictly easier than `b`.
 * @internal
 */
function isEasier(a: Difficulty, b: Difficulty): boolean {
  const order: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
  const indexA = order.indexOf(a)
  const indexB = order.indexOf(b)
  return indexA !== -1 && indexB !== -1 && indexA < indexB
}
