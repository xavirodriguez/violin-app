import { CompletedPracticeSession } from '@/lib/domain/practice';
/**
 * AchievementImageService
 *
 * Generates a shareable image for practice achievements using the Canvas API.
 */
export declare class AchievementImageService {
    static generateAchievementImage(session: CompletedPracticeSession, stars: number): Promise<string>;
    static share(session: CompletedPracticeSession, stars: number): Promise<void>;
}
