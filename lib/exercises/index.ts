/**
 * Main entry point for the exercises module.
 * This file processes all raw exercise data, generates the MusicXML,
 * and exports a single array of fully-formed Exercise objects.
 */
import type { Exercise, ExerciseData } from './types'
import { generateMusicXML } from './musicxml-builder'
import { openStringsExercises } from './categories/open-strings'
import { scalesExercises } from './categories/scales'
import { songsExercises } from './categories/songs'

/**
 * A factory function that takes raw exercise data, generates the
 * MusicXML for it, and returns the complete Exercise object.
 * @param exerciseData The raw data for the exercise.
 * @returns A complete Exercise object with the musicXML string.
 */
const createExercise = (exerciseData: ExerciseData): Exercise => {
  return {
    ...exerciseData,
    musicXML: generateMusicXML(exerciseData),
  }
}

// 1. Combine all raw exercise data from different categories
const allExerciseData: ExerciseData[] = [
  ...openStringsExercises,
  ...scalesExercises,
  ...songsExercises,
]

// 2. Process each exercise data object to create the final Exercise objects
export const allExercises: Exercise[] = allExerciseData.map(createExercise)
