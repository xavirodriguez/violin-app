/**
 * ScaleExercises
 * Exercise definitions for fundamental violin scales across one octave.
 *
 * @remarks
 * Scale practice is essential for developing:
 * - Muscle memory for finger placements
 * - Intonation accuracy across strings
 * - String crossing technique
 * - Bow distribution and control
 *
 * This module follows the Suzuki method progression, starting with
 * tetrachords (4-note patterns) before progressing to full octaves.
 */
import type { ExerciseData } from '../types';
/**
 * Enhanced exercise data with violin-specific pedagogical information.
 */
interface ViolinExerciseData extends ExerciseData {
    /** Starting string for the exercise (G, D, A, or E) */
    startingString?: 'G' | 'D' | 'A' | 'E';
    /** Finger pattern for the exercise (e.g., "0-1-2-3" for open-1st-2nd-3rd finger) */
    fingerPattern?: string;
    /** Recommended tempo range in BPM */
    tempoRange?: {
        min: number;
        max: number;
    };
    /** Learning objectives for this specific exercise */
    learningObjectives?: string[];
}
/**
 * Beginner scale exercises focusing on tetrachords and fundamental patterns.
 * Follows a progressive pedagogical approach starting with single-string exercises.
 */
export declare const scalesExercises: readonly ViolinExerciseData[];
/**
 * Utility to get exercises by difficulty level.
 * Useful for progressive lesson planning.
 */
export declare const getExercisesByDifficulty: (difficulty: "Beginner" | "Intermediate" | "Advanced") => ViolinExerciseData[];
/**
 * Utility to get exercises by starting string.
 * Useful for focusing practice on specific strings.
 */
export declare const getExercisesByString: (string: "G" | "D" | "A" | "E") => ViolinExerciseData[];
export {};
