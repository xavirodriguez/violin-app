import { AchievementCheckStats, AchievementDefinition } from './achievement-definitions';
import { Achievement } from '@/lib/domain/practice';
/**
 * Identifies which achievements have been newly unlocked based on current statistics.
 *
 * @param params - The stats and already unlocked IDs.
 * @returns An array of newly unlocked {@link Achievement} objects.
 */
export declare function checkAchievements(params: {
    stats: AchievementCheckStats;
    unlockedAchievementIds: string[];
}): Achievement[];
/**
 * Retrieves the full definition of an achievement by its unique identifier.
 *
 * @param id - The achievement ID to look up.
 * @returns The definition object or undefined if not found.
 */
export declare function getAchievementDefinition(id: string): AchievementDefinition | undefined;
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
export declare function getAchievementProgress(definition: AchievementDefinition, stats: AchievementCheckStats): number;
/**
 * Groups all available achievements by their respective categories.
 *
 * @returns A record mapping category names to arrays of definitions.
 */
export declare function getAllAchievementsByCategory(): Record<string, AchievementDefinition[]>;
