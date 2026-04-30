import {
  ACHIEVEMENT_DEFINITIONS,
  AchievementCheckStats,
  AchievementDefinition,
} from './achievement-definitions'
import { Achievement } from '@/lib/domain/practice'

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
 * Supports various condition types based on the achievement definitions.
 * Refactored to meet Senior Software Craftsmanship standards.
 */
export function getAchievementProgress(
  definition: AchievementDefinition,
  stats: AchievementCheckStats,
): number {
  const rawProgress = inferProgressFromDefinition(definition, stats)
  const clampedProgress = Math.max(0, Math.min(100, rawProgress))
  const roundedProgress = Math.round(clampedProgress)
  const finalResult = roundedProgress

  return finalResult
}

/**
 * Infers the progress percentage by matching achievement IDs to known thresholds.
 * @internal
 */
function inferProgressFromDefinition(
  definition: AchievementDefinition,
  stats: AchievementCheckStats,
): number {
  const { id, category } = definition

  if (category === 'streak') return calculateStreakProgress(id, stats)
  if (category === 'practice') return calculatePracticeProgress(id, stats)
  if (category === 'accuracy') return calculateAccuracyProgress(id, stats)
  if (category === 'mastery') return calculateMasteryProgress(id, stats)
  if (category === 'exploration') return calculateExplorationProgress(id, stats)

  return definition.condition(stats) ? 100 : 0
}

function calculateStreakProgress(id: string, stats: AchievementCheckStats): number {
  if (id.startsWith('hot-streak-')) {
    const target = parseTargetFromId(id, 'hot-streak-')
    const current = stats.currentSession.perfectNoteStreak
    return target > 0 ? (current / target) * 100 : 0
  }

  const dailyMapping: Record<string, number> = {
    'daily-dedication': 3,
    'weekly-warrior': 7,
    'month-master': 30,
  }
  const target = dailyMapping[id]
  const progress = target ? (stats.currentStreak / target) * 100 : 0

  return progress
}

function calculatePracticeProgress(id: string, stats: AchievementCheckStats): number {
  if (id === 'marathon-session') {
    const targetMs = 30 * 60 * 1000
    const currentMs = stats.currentSession.durationMs
    return (currentMs / targetMs) * 100
  }

  if (id === 'first-hundred-sessions') {
    const total = stats.totalSessions
    return (total / 100) * 100
  }

  return 0
}

function calculateAccuracyProgress(id: string, stats: AchievementCheckStats): number {
  if (id === 'perfect-exercise') {
    const accuracy = stats.currentSession.accuracy
    return accuracy
  }
  if (id === 'first-perfect-note') {
    const hasCorrect = stats.currentSession.correctNotes >= 1
    return hasCorrect ? 100 : 0
  }
  return 0
}

function calculateMasteryProgress(id: string, stats: AchievementCheckStats): number {
  if (id === 'notes-mastered-100') {
    const total = stats.totalNotesCompleted
    return (total / 100) * 100
  }
  return 0
}

function calculateExplorationProgress(id: string, stats: AchievementCheckStats): number {
  const mapping: Record<string, number> = { explorer: 5, completionist: 10 }
  const target = mapping[id]
  const completedCount = stats.exercisesCompleted.length
  const progress = target ? (completedCount / target) * 100 : 0

  return progress
}

/** Extracts a numeric target from an achievement ID suffix. */
function parseTargetFromId(id: string, prefix: string): number {
  const suffix = id.replace(prefix, '')
  const num = parseInt(suffix, 10)
  const result = Number.isFinite(num) ? num : 0

  return result
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
