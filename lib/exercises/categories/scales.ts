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

import type { ExerciseData, ScoreMetadata } from '../types'
import { parsePitch } from '../utils'

/**
 * Standard time signature for scale exercises.
 * @internal
 */
const STANDARD_TIME_SIGNATURE = { beats: 4, beatType: 4 } as const

/**
 * Creates score metadata for a major key.
 * @param sharps - Number of sharps in the key signature (1-7)
 * @internal
 */
const createMajorKeyMetadata = (sharps: number): ScoreMetadata => ({
  clef: 'G' as const,
  timeSignature: STANDARD_TIME_SIGNATURE,
  keySignature: sharps,
})

/** Score metadata configurations for major scales. @internal */
const SCALE_METADATA = {
  G_MAJOR: createMajorKeyMetadata(1), // G Major (F#)
  D_MAJOR: createMajorKeyMetadata(2), // D Major (F#, C#)
  A_MAJOR: createMajorKeyMetadata(3), // A Major (F#, C#, G#)
} as const

/**
 * Note duration constants for better readability.
 * @internal
 */
const DURATION = {
  WHOLE: 1,
  HALF: 2,
  QUARTER: 4,
  EIGHTH: 8,
} as const

/**
 * Enhanced exercise data with violin-specific pedagogical information.
 */
interface ViolinExerciseData extends ExerciseData {
  /** Starting string for the exercise (G, D, A, or E) */
  startingString?: 'G' | 'D' | 'A' | 'E'
  /** Finger pattern for the exercise (e.g., "0-1-2-3" for open-1st-2nd-3rd finger) */
  fingerPattern?: string
  /** Recommended tempo range in BPM */
  tempoRange?: { min: number; max: number }
  /** Learning objectives for this specific exercise */
  learningObjectives?: string[]
}

/**
 * Creates a tetrachord (4-note scale segment) exercise.
 *
 * @param config - Configuration for the tetrachord exercise
 * @returns Complete exercise data with pedagogical metadata
 * @internal
 */
const createTetrachordExercise = (config: {
  id: string
  key: 'G' | 'D' | 'A'
  startNote: string
  notes: string[]
  fingerPattern: string
  startingString: 'G' | 'D' | 'A' | 'E'
}): ViolinExerciseData => {
  const scaleMetadataMap = {
    G: SCALE_METADATA.G_MAJOR,
    D: SCALE_METADATA.D_MAJOR,
    A: SCALE_METADATA.A_MAJOR,
  }

  return {
    id: config.id,
    name: `${config.key} Major Tetrachord (Lower)`,
    description: `Practice the first four notes of the ${config.key} major scale, establishing the foundational finger pattern on the ${config.startingString} string.`,
    category: 'Scales',
    difficulty: 'Beginner',
    scoreMetadata: scaleMetadataMap[config.key],
    notes: config.notes.map((pitch) => ({
      pitch: parsePitch(pitch),
      duration: DURATION.QUARTER,
    })),
    startingString: config.startingString,
    fingerPattern: config.fingerPattern,
    tempoRange: { min: 60, max: 120 },
    learningObjectives: [
      `Establish correct finger spacing for ${config.key} major`,
      'Develop even tone production across four notes',
      'Practice accurate intonation for the tetrachord pattern',
      'Build muscle memory for finger placement',
    ],
  }
}

/**
 * Creates a full one-octave scale exercise.
 *
 * @param config - Configuration for the full scale exercise
 * @returns Complete exercise data with pedagogical metadata
 * @internal
 */
const createFullScaleExercise = (config: {
  id: string
  key: 'G' | 'D' | 'A'
  notes: string[]
  fingerPattern: string
  startingString: 'G' | 'D' | 'A' | 'E'
  crossingString?: 'D' | 'A' | 'E'
}): ViolinExerciseData => {
  const scaleMetadataMap = {
    G: SCALE_METADATA.G_MAJOR,
    D: SCALE_METADATA.D_MAJOR,
    A: SCALE_METADATA.A_MAJOR,
  }

  const objectives = [
    `Master the complete ${config.key} major scale across one octave`,
    'Develop smooth string crossing technique',
    'Maintain consistent tone quality throughout the scale',
    'Practice even rhythm and bow distribution',
  ]

  if (config.crossingString) {
    objectives.push(
      `Execute smooth transition from ${config.startingString} to ${config.crossingString} string`,
    )
  }

  return {
    id: config.id,
    name: `${config.key} Major Scale (One Octave)`,
    description: `Complete ${config.key} major scale spanning one octave, requiring string crossing and consistent finger patterns.`,
    category: 'Scales',
    difficulty: 'Intermediate',
    scoreMetadata: scaleMetadataMap[config.key],
    notes: config.notes.map((pitch) => ({
      pitch: parsePitch(pitch),
      duration: DURATION.QUARTER,
    })),
    startingString: config.startingString,
    fingerPattern: config.fingerPattern,
    tempoRange: { min: 80, max: 144 },
    learningObjectives: objectives,
  }
}

/**
 * Beginner scale exercises focusing on tetrachords and fundamental patterns.
 * Follows a progressive pedagogical approach starting with single-string exercises.
 */
export const scalesExercises: readonly ViolinExerciseData[] = [
  // G Major Tetrachord (D and A strings)
  createTetrachordExercise({
    id: 'g-major-tetrachord-lower',
    key: 'G',
    startNote: 'G4',
    notes: ['G4', 'A4', 'B4', 'C5'],
    fingerPattern: '0-1-2-3',
    startingString: 'D',
  }),

  // D Major Tetrachord (A string)
  createTetrachordExercise({
    id: 'd-major-tetrachord-lower',
    key: 'D',
    startNote: 'D4',
    notes: ['D4', 'E4', 'F#4', 'G4'],
    fingerPattern: '0-1-2-3',
    startingString: 'A',
  }),

  // A Major Tetrachord (A and E strings)
  createTetrachordExercise({
    id: 'a-major-tetrachord-lower',
    key: 'A',
    startNote: 'A4',
    notes: ['A4', 'B4', 'C#5', 'D5'],
    fingerPattern: '0-1-2-3',
    startingString: 'E',
  }),

  // Full octave scales (for progression)
  createFullScaleExercise({
    id: 'g-major-scale-one-octave',
    key: 'G',
    notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
    fingerPattern: '0-1-2-3 / 0-1-2-3',
    startingString: 'D',
    crossingString: 'A',
  }),

  createFullScaleExercise({
    id: 'd-major-scale-one-octave',
    key: 'D',
    notes: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'],
    fingerPattern: '0-1-2-3 / 0-1-2-3',
    startingString: 'A',
    crossingString: 'E',
  }),

  createFullScaleExercise({
    id: 'a-major-scale-one-octave',
    key: 'A',
    notes: ['A3', 'B3', 'C#4', 'D4', 'E4', 'F#4', 'G#4', 'A4'],
    fingerPattern: '0-1-2-3 / 0-1-2-3',
    startingString: 'G',
    crossingString: 'D',
  }),
] as const

/**
 * Utility to get exercises by difficulty level.
 * Useful for progressive lesson planning.
 */
export const getExercisesByDifficulty = (
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
): ViolinExerciseData[] => {
  return scalesExercises.filter((ex) => ex.difficulty === difficulty)
}

/**
 * Utility to get exercises by starting string.
 * Useful for focusing practice on specific strings.
 */
export const getExercisesByString = (string: 'G' | 'D' | 'A' | 'E'): ViolinExerciseData[] => {
  return scalesExercises.filter((ex) => ex.startingString === string)
}
