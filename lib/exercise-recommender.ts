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
 * @param params - Recommendation input.
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
export function getRecommendedExercise(params: {
  exercises: Exercise[]
  userProgress: UserProgress
  lastPlayedId?: string
  difficultyFilter?: string
}): Exercise | undefined {
  const filtered = filterExercisesByDifficulty(params)
  const hasExercises = filtered.length > 0
  if (!hasExercises) return undefined

  const filteredParams = { ...params, exercises: filtered }
  const recommendation = findFirstValidRecommendation(filteredParams)
  const finalRecommendation = recommendation || filtered[0]

  return finalRecommendation
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

function findFirstValidRecommendation(params: RecommendationParams): Exercise | undefined {
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

function getPersistenceRecommendation(params: RecommendationParams): Exercise | undefined {
  const { exercises, userProgress, lastPlayedId } = params
  if (!lastPlayedId) return undefined

  const stats = userProgress.exerciseStats[lastPlayedId]
  const isRecentFailure =
    stats && Date.now() - stats.lastPracticedMs < DAY_MS && stats.bestAccuracy < 80

  return isRecentFailure ? exercises.find((ex) => ex.id === lastPlayedId) : undefined
}

function getReviewRecommendation(params: RecommendationParams): Exercise | undefined {
  const { exercises, userProgress } = params
  const lowAccuracyId = findLowAccuracyExerciseId(userProgress)
  if (!lowAccuracyId) return undefined

  const exercise = exercises.find((ex) => ex.id === lowAccuracyId)
  if (!exercise || exercise.difficulty === 'Beginner') {
    return exercise
  }

  return getEasierAlternative(exercises, exercise)
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

function getProgressionDiscoveryRecommendation(params: RecommendationParams): Exercise | undefined {
  const { exercises, userProgress, difficultyFilter } = params
  const isSpecific = !!difficultyFilter && difficultyFilter !== 'all'

  if (isSpecific) {
    return findFirstUnplayedByDifficulty({ exercises, userProgress, difficulty: difficultyFilter! })
  }

  const targetDifficulty = determineTargetDifficulty(exercises, userProgress)
  return findFirstUnplayedByDifficulty({
    exercises,
    userProgress,
    difficulty: targetDifficulty,
  })
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

function getSpacedRepetitionRecommendation(params: RecommendationParams): Exercise | undefined {
  const { exercises, userProgress } = params
  const now = Date.now()

  return exercises.find((ex) => {
    const stats = userProgress.exerciseStats[ex.id]
    return !stats || now - stats.lastPracticedMs > DAY_MS
  })
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
