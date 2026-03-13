import { ACHIEVEMENT_DEFINITIONS, AchievementCheckStats } from './achievement-definitions'
import type { Achievement } from '@/stores/analytics-store'

/**
 * Verifica qué logros se han desbloqueado con las estadísticas actuales
 */
export function checkAchievements(
  stats: AchievementCheckStats,
  unlockedAchievementIds: string[],
): Achievement[] {
  const newlyUnlocked: Achievement[] = []

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    // Saltar si ya está desbloqueado
    if (unlockedAchievementIds.includes(def.id)) continue

    // Verificar condición
    if (def.condition(stats)) {
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
 * Obtiene la definición completa de un logro por ID
 */
export function getAchievementDefinition(id: string) {
  return ACHIEVEMENT_DEFINITIONS.find((def) => def.id === id)
}

/**
 * Obtiene todos los logros disponibles agrupados por categoría
 */
export function getAllAchievementsByCategory() {
  const grouped: Record<string, typeof ACHIEVEMENT_DEFINITIONS> = {}

  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    if (!grouped[achievement.category]) {
      grouped[achievement.category] = []
    }
    grouped[achievement.category].push(achievement)
  }

  return grouped
}
