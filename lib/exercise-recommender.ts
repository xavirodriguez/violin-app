import type { Exercise, Difficulty } from '@/lib/domain/exercise'
import type { AnalyticsStore } from '@/stores/analytics-store'

/** Shorthand for user progress from the Analytics store. */
type UserProgress = AnalyticsStore['progress']

const DAY_MS = 86_400_000

/**
 * Pedagogical exercise recommender engine.
 *
 * @remarks
 * This function acts as an "Automated Tutor" that implements heuristic-based logic
 * designed to optimize the student's learning path based on historical performance,
 * ensuring the student is neither bored nor overwhelmed.
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
 * @returns The recommended {@link Exercise}, or the first available one as a fallback. Returns `undefined` if the library is empty.
 *
 * @example
 * ```ts
 * const nextExercise = getRecommendedExercise({
 *   exercises: allExercises,
 *   userProgress: progress,
 *   lastPlayedId: "scale_c_major",
 * });
 * ```
 *
 * @public
 */
export interface ExerciseRecommendation extends Exercise {
  recommendationReason: string
}

export function getRecommendedExercise(params: {
  exercises: Exercise[]
  userProgress: UserProgress
  lastPlayedId?: string
  difficultyFilter?: string
}): ExerciseRecommendation | undefined {
  const filtered = filterExercisesByDifficulty(params)
  const hasExercises = filtered.length > 0
  if (!hasExercises) return undefined

  const filteredParams = { ...params, exercises: filtered }
  const recommendation = findFirstValidRecommendation(filteredParams)

  if (recommendation) return recommendation

  // Default fallback
  return {
    ...filtered[0],
    recommendationReason: 'Continue your journey with the next exercise in the library.'
  }
}

function filterExercisesByDifficulty(params: {
  exercises: Exercise[]
  difficultyFilter?: string
}): Exercise[] {
  const { exercises, difficultyFilter } = params
  const hasFilter = !!difficultyFilter
  if (!hasFilter) return exercises

  const filtered = exercises.filter((ex) => ex.difficulty === difficultyFilter)
  return filtered
}

function findFirstValidRecommendation(params: RecommendationParams): ExerciseRecommendation | undefined {
  const recommendation =
    getPersistenceRecommendation(params) ||
    getReviewRecommendation(params) ||
    getProgressionDiscoveryRecommendation(params) ||
    getSpacedRepetitionRecommendation(params)

  return recommendation
}

interface RecommendationParams {
  exercises: Exercise[]
  userProgress: UserProgress
  lastPlayedId?: string
  difficultyFilter?: string
}

function getPersistenceRecommendation(params: RecommendationParams): ExerciseRecommendation | undefined {
  const { exercises, userProgress, lastPlayedId } = params
  if (!lastPlayedId) return undefined

  const stats = userProgress.exerciseStats[lastPlayedId]
  const isRecentFailure =
    stats && Date.now() - stats.lastPracticedMs < DAY_MS && stats.bestAccuracy < 80

  const ex = isRecentFailure ? exercises.find((ex) => ex.id === lastPlayedId) : undefined
  if (!ex) return undefined

  return {
    ...ex,
    recommendationReason: 'Build muscle memory by repeating your last attempt.'
  }
}

function getReviewRecommendation(params: RecommendationParams): ExerciseRecommendation | undefined {
  const { exercises, userProgress } = params
  const lowAccuracyId = findLowAccuracyExerciseId(userProgress)
  if (!lowAccuracyId) return undefined

  const exercise = exercises.find((ex) => ex.id === lowAccuracyId)
  if (!exercise) return undefined

  if (exercise.difficulty === 'Beginner') {
    return {
      ...exercise,
      recommendationReason: 'Reinforce fundamentals to improve your accuracy.'
    }
  }

  const easier = getEasierAlternative(exercises, exercise)
  return {
    ...easier,
    recommendationReason: 'Focus on core techniques with a simpler exercise.'
  }
}

function findLowAccuracyExerciseId(userProgress: UserProgress): string | undefined {
  const ids = Object.keys(userProgress.exerciseStats)
  const result = ids.find((id) => {
    const stats = userProgress.exerciseStats[id]
    return stats.bestAccuracy < 70 && stats.timesCompleted > 0
  })

  return result
}

function getEasierAlternative(exercises: Exercise[], exercise: Exercise): Exercise {
  const alternative = exercises.find((ex) => {
    const isSameCategory = ex.category === exercise.category
    const isSimpler = isEasier(ex.difficulty, exercise.difficulty)
    return isSameCategory && isSimpler
  })

  return alternative || exercise
}

function getProgressionDiscoveryRecommendation(params: RecommendationParams): ExerciseRecommendation | undefined {
  const { exercises, userProgress, difficultyFilter } = params
  const isSpecific = !!difficultyFilter && difficultyFilter !== 'all'

  let ex: Exercise | undefined
  if (isSpecific) {
    ex = findFirstUnplayedByDifficulty({ exercises, userProgress, difficulty: difficultyFilter! })
  } else {
    const targetDifficulty = determineTargetDifficulty(exercises, userProgress)
    ex = findFirstUnplayedByDifficulty({
      exercises,
      userProgress,
      difficulty: targetDifficulty,
    })
  }

  if (!ex) return undefined

  return {
    ...ex,
    recommendationReason: 'Advance your skills with a new challenge.'
  }
}

function findFirstUnplayedByDifficulty(params: {
  exercises: Exercise[]
  userProgress: UserProgress
  difficulty: string
}): Exercise | undefined {
  const { exercises, userProgress, difficulty } = params
  const diffLower = difficulty.toLowerCase()
  const match = exercises.find((ex) => {
    const isSameDiff = ex.difficulty.toLowerCase() === diffLower
    const stats = userProgress.exerciseStats[ex.id]
    const isUnplayed = (stats?.timesCompleted ?? 0) === 0
    return isSameDiff && isUnplayed
  })

  return match
}

function determineTargetDifficulty(exercises: Exercise[], userProgress: UserProgress): Difficulty {
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
  const found = difficulties.find((diff) => {
    const isCompleted = isDifficultyCompleted({ exercises, userProgress, difficulty: diff })
    return !isCompleted
  })

  const target = found || 'Advanced'
  return target
}

function isDifficultyCompleted(params: {
  exercises: Exercise[]
  userProgress: UserProgress
  difficulty: Difficulty
}): boolean {
  const { exercises, userProgress, difficulty } = params
  const diffEx = exercises.filter((ex) => ex.difficulty === difficulty)
  if (diffEx.length === 0) return false

  const isCompleted = diffEx.every((ex) => {
    const stats = userProgress.exerciseStats[ex.id]
    return (stats?.timesCompleted ?? 0) > 0
  })

  return isCompleted
}

function getSpacedRepetitionRecommendation(params: RecommendationParams): ExerciseRecommendation | undefined {
  const { exercises, userProgress } = params
  const now = Date.now()

  const ex = exercises.find((ex) => {
    const stats = userProgress.exerciseStats[ex.id]
    return !stats || now - stats.lastPracticedMs > DAY_MS
  })

  if (!ex) return undefined

  return {
    ...ex,
    recommendationReason: 'Keep your technique fresh with a quick review.'
  }
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
