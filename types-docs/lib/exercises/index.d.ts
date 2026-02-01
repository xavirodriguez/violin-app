/**
 * Exercises
 * Main entry point for the exercises module.
 * This file aggregates raw exercise data from various categories,
 * processes them to generate MusicXML, and exports the final collection.
 */
import type { Exercise } from './types';
/**
 * A comprehensive collection of all exercises available in the application.
 *
 * @remarks
 * This array is used by the `PracticeMode` component to populate its selection
 * dropdown and by the store to load individual exercises.
 *
 * Exercises are processed once at module load time.
 */
export declare const allExercises: Exercise[];
