/**
 * Sistema de logros basado en milestones de práctica
 */
export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'practice' | 'accuracy' | 'streak' | 'mastery' | 'exploration';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    condition: (stats: AchievementCheckStats) => boolean;
    reward?: {
        message: string;
        confetti?: boolean;
        sound?: string;
    };
}
export interface AchievementCheckStats {
    currentSession: {
        correctNotes: number;
        perfectNoteStreak: number;
        accuracy: number;
        durationMs: number;
        exerciseId: string;
    };
    totalSessions: number;
    totalPracticeDays: number;
    currentStreak: number;
    longestStreak: number;
    exercisesCompleted: string[];
    totalPracticeTimeMs: number;
    averageAccuracy: number;
}
export declare const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[];
