import type { Exercise } from '@/lib/domain/musical-types';
import type { AnalyticsStore } from '@/stores/analytics-store';
/** Shorthand for user progress from the Analytics store. */
type UserProgress = AnalyticsStore['progress'];
/**
 * Pedagogical exercise recommender engine.
 *
 * @remarks
 * This function implements a heuristic-based logic designed to optimize
 * the student's learning path based on historical performance.
 *
 * **Recommendation Rules (in order of priority)**:
 * 1. **Persistence**: If the last exercise played had low accuracy (`< 80%`) and was attempted today, suggest trying it again.
 * 2. **Review with Regression**: If a completed exercise has low accuracy (`< 70%`), suggest an easier exercise in the same category.
 * 3. **Progression**: If all exercises in the current difficulty are mastered, suggest the first exercise of the next level.
 * 4. **Discovery**: Suggest the first unplayed exercise in the current target difficulty.
 * 5. **Spaced Repetition**: Suggest the oldest practiced exercise that wasn't played today.
 *
 * @param exercises - Array of all available exercises.
 * @param userProgress - The user's historical progress and statistics.
 * @param lastPlayedId - ID of the exercise practiced in the previous session.
 * @returns The recommended {@link Exercise}, or the first available one as a fallback.
 *
 * @public
 */
export declare function getRecommendedExercise(exercises: Exercise[], userProgress: UserProgress, lastPlayedId?: string): Exercise | null;
export {};
