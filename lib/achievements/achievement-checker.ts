import {
  ACHIEVEMENT_DEFINITIONS,
  AchievementCheckStats,
  AchievementDefinition,
} from './achievement-definitions'
import type { Achievement } from '@/stores/analytics-store'

/**
 * Identifies which achievements have been newly unlocked based on current statistics.
 *
 * @param params - The stats and already unlocked IDs.
 * @returns An array of newly unlocked {@link Achievement} objects.
 */
export function checkAchievements(params: {
  stats: AchievementCheckStats
  unlockedAchievementIds: string[]
}): Achievement[] {
  const { stats, unlockedAchievementIds } = params
  const newlyUnlocked: Achievement[] = []

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const isEligible = isEligibleForUnlock({ def, stats, unlockedAchievementIds })

    if (isEligible) {
      newlyUnlocked.push({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        unlockedAtMs: Date.now(),
      })
    }
  }

  return newlyUnlocked
}

/**
 * Determines if an achievement definition is eligible to be unlocked.
 * @internal
 */
function isEligibleForUnlock(params: {
  def: AchievementDefinition
  stats: AchievementCheckStats
  unlockedAchievementIds: string[]
}): boolean {
  const { def, stats, unlockedAchievementIds } = params
  const alreadyUnlocked = unlockedAchievementIds.includes(def.id)
  const conditionMet = def.condition(stats)
  const isEligible = !alreadyUnlocked && conditionMet

  return isEligible
}

/**
 * Retrieves the full definition of an achievement by its unique identifier.
 *
 * @param id - The achievement ID to look up.
 * @returns The definition object or undefined if not found.
 */
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  const definitions = ACHIEVEMENT_DEFINITIONS
  const targetId = id
  const result = definitions.find((def) => def.id === targetId)
  const finalResult = result ?? undefined

  return finalResult
}

/**
 * Calculates the progress percentage (0–100) towards unlocking an achievement.
 *
 * @param definition - The achievement definition to evaluate.
 * @param stats - The current user statistics.
 * @returns A number from 0 to 100 representing completion percentage.
 *
 * @remarks
 * Supports the following condition types based on the achievement definitions:
 * - `perfectNoteStreak`: based on current session streak
 * - `currentStreak`: based on daily practice streak
 * - `totalSessions`: based on total session count
 * - `exercisesCompleted.length`: based on unique exercises completed
 * - `totalNotesCompleted`: based on cumulative notes
 * - `durationMs`: based on session duration
 * - `accuracy`: based on current session accuracy
 * - `correctNotes`: based on current session correct notes
 *
 * Falls back to a boolean 0/100 if the condition type cannot be inferred.
 */
export function getAchievementProgress(
  definition: AchievementDefinition,
  stats: AchievementCheckStats,
): number {
  const progress = inferProgressFromDefinition(definition, stats)
  return Math.min(100, Math.max(0, Math.round(progress)))
}

/**
 * Infers the progress percentage by matching achievement IDs to known thresholds.
 * @internal
 */
function inferProgressFromDefinition(
  definition: AchievementDefinition,
  stats: AchievementCheckStats,
): number {
  const id = definition.id

  // Streak-based achievements (perfect note streaks)
  if (id.startsWith('hot-streak-')) {
    const target = parseTargetFromId(id, 'hot-streak-')
    if (target > 0) return (stats.currentSession.perfectNoteStreak / target) * 100
  }

  // Daily streak achievements
  if (id === 'daily-dedication') return (stats.currentStreak / 3) * 100
  if (id === 'weekly-warrior') return (stats.currentStreak / 7) * 100
  if (id === 'month-master') return (stats.currentStreak / 30) * 100

  // Session milestones
  if (id === 'marathon-session') {
    const targetMs = 30 * 60 * 1000
    return (stats.currentSession.durationMs / targetMs) * 100
  }
  if (id === 'first-hundred-sessions') return (stats.totalSessions / 100) * 100

  // Accuracy-based
  if (id === 'perfect-exercise') return stats.currentSession.accuracy
  if (id === 'first-perfect-note') {
    return stats.currentSession.correctNotes >= 1 ? 100 : 0
  }

  // Notes mastered
  if (id === 'notes-mastered-100') return (stats.totalNotesCompleted / 100) * 100

  // Exploration
  if (id === 'explorer') return (stats.exercisesCompleted.length / 5) * 100
  if (id === 'completionist') return (stats.exercisesCompleted.length / 10) * 100

  // Fallback: boolean check
  return definition.condition(stats) ? 100 : 0
}

/** Extracts a numeric target from an achievement ID suffix. */
function parseTargetFromId(id: string, prefix: string): number {
  const suffix = id.replace(prefix, '')
  const num = parseInt(suffix, 10)
  return Number.isFinite(num) ? num : 0
}

/**
 * Groups all available achievements by their respective categories.
 *
 * @returns A record mapping category names to arrays of definitions.
 */
export function getAllAchievementsByCategory(): Record<string, AchievementDefinition[]> {
  const grouped: Record<string, AchievementDefinition[]> = {}
  const allDefinitions = ACHIEVEMENT_DEFINITIONS

  for (const achievement of allDefinitions) {
    const category = achievement.category
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(achievement)
  }

  return grouped
}
