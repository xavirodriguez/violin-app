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
