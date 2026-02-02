import type { Exercise } from '@/lib/domain/musical-types';
import type { AnalyticsStore } from '@/stores/analytics-store';
type UserProgress = AnalyticsStore['progress'];
/**
 * Pedagogical exercise recommender logic.
 */
export declare function getRecommendedExercise(exercises: Exercise[], userProgress: UserProgress, lastPlayedId?: string): Exercise | null;
export {};
