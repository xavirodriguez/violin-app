/**
 * MusicXMLBuilder
 * Provides logic for generating MusicXML 3.1 strings from structured exercise data.
 * This allows dynamic creation of sheet music for OpenSheetMusicDisplay to render.
 */
import type { ExerciseData } from './types';
/**
 * Generates a complete MusicXML string from an ExerciseData object.
 *
 * @param exercise - The raw data for the exercise.
 * @returns A valid MusicXML 3.1 score string.
 *
 * @remarks
 * Current implementation limitations:
 * - Assumes a single part named "Violin".
 * - Consolidates all notes into a single measure (Measure 1).
 * - Fixed division value of 1.
 *
 * @example
 * ```ts
 * const xml = generateMusicXML(myExerciseData);
 * ```
 */
export declare const generateMusicXML: (exercise: ExerciseData) => string;
