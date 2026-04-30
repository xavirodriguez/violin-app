import { PracticeSession } from '@/lib/domain/practice-session';
export declare function formatTime(seconds: number): string;
export declare function getLast7DaysData(sessions: PracticeSession[]): {
    day: string;
    minutes: number;
}[];
interface DailyStatsParams {
    sessions: PracticeSession[];
    dayOffset: number;
}
export declare function getDailyStats(params: DailyStatsParams): {
    day: string;
    minutes: number;
};
export declare function getDayName(date: Date): string;
export declare function filterSessionsByDate(sessions: PracticeSession[], date: Date): PracticeSession[];
export declare function calculateTotalMinutes(sessions: PracticeSession[]): number;
export declare function getHeatmapData(lastSession: PracticeSession | undefined): {
    noteIndex: number;
    targetPitch: string;
    accuracy: number;
    cents: number;
}[];
export {};
