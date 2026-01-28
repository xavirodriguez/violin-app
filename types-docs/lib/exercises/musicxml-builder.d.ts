/**
 * MusicXMLBuilder
 * Provides logic for generating MusicXML 3.1 strings from structured exercise data.
 */
import type { ExerciseData } from './types';
/**
 * Generates a complete MusicXML string from an ExerciseData object.
 */
export declare const generateMusicXML: (exercise: ExerciseData) => string;
