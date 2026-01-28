/**
 * ScaleExercises
 * Exercise definitions for fundamental violin scales (G, D, A Major).
 *
 * @remarks
 * Scale practice is essential for developing muscle memory for finger
 * placements and improving intonation across different strings and hand positions.
 */

import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

/** Shared metadata for G Major exercises. @internal */
const SCORE_METADATA_G_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 1, // G Major / E Minor
}

/** Shared metadata for D Major exercises. @internal */
const SCORE_METADATA_D_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 2, // D Major / B Minor
}

/** Shared metadata for A Major exercises. @internal */
const SCORE_METADATA_A_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 3, // A Major / F# Minor
}

/**
 * List of beginner exercises for major scales.
 */
export const scalesExercises: ExerciseData[] = [
  {
    id: 'g-major-scale-first-4',
    name: 'G Major Scale (First 4 Notes)',
    description: 'Practice the first four notes of the G major scale.',
    category: 'Scales',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_G_MAJOR,
    notes: [
      { pitch: parsePitch('G4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('C5'), duration: 4 },
    ],
  },
  {
    id: 'd-major-scale-first-4',
    name: 'D Major Scale (First 4 notes)',
    description: 'Practice the first four notes of the D major scale.',
    category: 'Scales',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_D_MAJOR,
    notes: [
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('F#4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 4 },
    ],
  },
  {
    id: 'a-major-scale-first-4',
    name: 'A Major Scale (First 4 notes)',
    description: 'Practice the first four notes of the A major scale.',
    category: 'Scales',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_A_MAJOR,
    notes: [
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('C#5'), duration: 4 },
      { pitch: parsePitch('D5'), duration: 4 },
    ],
  },
]
