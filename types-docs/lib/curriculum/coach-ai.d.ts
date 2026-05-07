import { UserProgress } from '@/stores/analytics-store';
import { ObjectiveMastery } from '@/stores/mastery-store';
export interface CoachInsight {
    title: string;
    message: string;
    type: 'encouragement' | 'warning' | 'celebration' | 'tip';
    persona: 'The Encourager' | 'The Technical Sage' | 'The Motivator';
}
/**
 * CoachAIService
 *
 * Analyzes historical performance data to generate pedagogical narrative feedback.
 */
export declare class CoachAIService {
    /**
     * Generates a collection of insights based on user progress and mastery.
     */
    static getInsights(progress: UserProgress, mastery: Record<string, ObjectiveMastery>): CoachInsight[];
}
