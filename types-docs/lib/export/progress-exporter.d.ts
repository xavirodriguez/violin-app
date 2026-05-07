import { PracticeSession } from '@/lib/domain/practice';
/**
 * Generates a CSV string from an array of practice sessions.
 *
 * @param sessions - The list of practice sessions to export.
 * @returns A formatted CSV string with headers.
 */
export declare function exportSessionsToCSV(sessions: PracticeSession[]): string;
/**
 * Triggers a browser download for the provided CSV content.
 *
 * @param content - The CSV string to download.
 * @param filename - The desired name of the file (e.g., "progress.csv").
 */
export declare function downloadCSV(content: string, filename: string): void;
