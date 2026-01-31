/**
 * Exercises
 * Main entry point for the exercises module.
 * This file aggregates raw exercise data from various categories,
 * processes them to generate MusicXML, and exports the final collection.
 */

import type { Exercise, ExerciseData } from './types'
export type { Exercise }
import { generateMusicXML } from './musicxml-builder'
import { openStringsExercises } from './categories/open-strings'
import { scalesExercises } from './categories/scales'
import { songsExercises } from './categories/songs'

/**
 * A factory function that transforms raw exercise data into a complete Exercise object.
 *
 * @param exerciseData - The raw definition of the exercise.
 * @returns A fully-formed Exercise object including the generated MusicXML string.
 *
 * @remarks
 * This function ensures that the `musicXML` property is correctly populated
 * using the `generateMusicXML` builder before the exercise is consumed by the UI.
 */
const createExercise = (exerciseData: ExerciseData): Exercise => {
  return {
    ...exerciseData,
    musicXML: generateMusicXML(exerciseData),
  }
}

/**
 * Flat list of all raw exercise data definitions.
 * @internal
 */
const allExerciseData: ExerciseData[] = [
  ...openStringsExercises,
  ...scalesExercises,
  ...songsExercises,
]

/**
 * A comprehensive collection of all exercises available in the application.
 *
 * @remarks
 * This array is used by the `PracticeMode` component to populate its selection
 * dropdown and by the store to load individual exercises.
 *
 * Exercises are processed once at module load time.
 */
export const allExercises: Exercise[] = allExerciseData.map(createExercise)
