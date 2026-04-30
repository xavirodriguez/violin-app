import type { PracticeSession } from '@/stores/analytics-store';
/**
 * Generates a shareable image for exercise completion.
 * Decomposed into focused helpers for Senior Software Craftsmanship.
 */
export declare function generateAchievementImage(sessionData: PracticeSession, stars: number): Promise<Blob>;
