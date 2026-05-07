import { UserProgress } from '@/stores/analytics-store';
import { ObjectiveMastery } from '@/stores/mastery-store';
import { PersistedPracticeSession } from '@/lib/domain/practice';
export interface StudentReport {
    studentName: string;
    generationDate: number;
    summary: {
        totalPracticeMinutes: number;
        sessionsCount: number;
        averageAccuracy: number;
        activeStreak: number;
    };
    skillsOverview: {
        label: string;
        mastery: number;
        status: 'Mastered' | 'Developing' | 'Needs Review';
    }[];
    recentActivity: {
        date: number;
        exerciseName: string;
        accuracy: number;
        durationMs: number;
    }[];
    teacherNotes: string;
}
/**
 * ReportingService
 *
 * Aggregates data for external pedagogical review (Parents/Teachers).
 */
export declare class ReportingService {
    static generateReport(progress: UserProgress, mastery: Record<string, ObjectiveMastery>, sessions: PersistedPracticeSession[]): StudentReport;
}
