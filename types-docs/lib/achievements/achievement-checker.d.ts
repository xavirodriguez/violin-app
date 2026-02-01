import { AchievementCheckStats } from './achievement-definitions';
import type { Achievement } from '@/stores/analytics-store';
/**
 * Verifica qué logros se han desbloqueado con las estadísticas actuales
 */
export declare function checkAchievements(stats: AchievementCheckStats, unlockedAchievementIds: string[]): Achievement[];
/**
 * Obtiene la definición completa de un logro por ID
 */
export declare function getAchievementDefinition(id: string): import("./achievement-definitions").AchievementDefinition | undefined;
/**
 * Obtiene todos los logros disponibles agrupados por categoría
 */
export declare function getAllAchievementsByCategory(): Record<string, import("./achievement-definitions").AchievementDefinition[]>;
