import type { PracticeSession } from '@/stores/analytics-store';
/**
 * Generates a shareable image for exercise completion.
 */
export declare function generateAchievementImage(sessionData: PracticeSession, stars: number): Promise<Blob>;
