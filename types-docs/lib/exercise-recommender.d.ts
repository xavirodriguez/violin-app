import type { Exercise } from '@/lib/domain/exercise';
import type { AnalyticsStore } from '@/stores/analytics-store';
/** Shorthand for user progress from the Analytics store. */
type UserProgress = AnalyticsStore['progress'];
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
    recommendationReason: string;
}
export declare function getRecommendedExercise(params: {
    exercises: Exercise[];
    userProgress: UserProgress;
    lastPlayedId?: string;
    difficultyFilter?: string;
}): ExerciseRecommendation | undefined;
export {};
