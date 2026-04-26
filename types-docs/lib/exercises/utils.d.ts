/**
 * Utility functions for handling exercise data.
 */
import type { NoteDuration, Pitch, Exercise } from './types';
import { ExerciseStats } from '@/stores/progress.store';
/**
 * Calculates the duration of a note in milliseconds based on BPM.
 */
export declare const getDurationMs: (duration: NoteDuration, bpm?: number) => number;
/**
 * Parses a pitch string (e.g., "G#4", "Bb3") into a Pitch object.
 */
export declare const parsePitch: (pitchString: string) => Pitch;
/**
 * Parameters for filtering exercises.
 */
export interface ExerciseFilterParams {
    exercises: Exercise[];
    filter: {
        activeTab: string;
        difficulty?: string;
    };
    stats: Record<string, ExerciseStats>;
}
/**
 * Pure function to filter exercises based on tab and difficulty.
 */
export declare function filterExercises(params: ExerciseFilterParams): Exercise[];
