/**
 * Exercise data for scale exercises.
 */
import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

const SCORE_METADATA_G_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 1, // G Major / E Minor
}

const SCORE_METADATA_D_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 2, // D Major / B Minor
}

const SCORE_METADATA_A_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 3, // A Major / F# Minor
}

export const scalesExercises: ExerciseData[] = [
  {
    id: 'g-major-scale-first-4',
    name: 'G Major Scale (First 4 Notes)',
    description: 'Practice the first four notes of the G major scale.',
    category: 'Scales',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_G_MAJOR,
    notes: [
      { pitch: parsePitch('G4'), duration: 'quarter' },
      { pitch: parsePitch('A4'), duration: 'quarter' },
      { pitch: parsePitch('B4'), duration: 'quarter' },
      { pitch: parsePitch('C5'), duration: 'quarter' },
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
      { pitch: parsePitch('D4'), duration: 'quarter' },
      { pitch: parsePitch('E4'), duration: 'quarter' },
      { pitch: parsePitch('F#4'), duration: 'quarter' },
      { pitch: parsePitch('G4'), duration: 'quarter' },
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
      { pitch: parsePitch('A4'), duration: 'quarter' },
      { pitch: parsePitch('B4'), duration: 'quarter' },
      { pitch: parsePitch('C#5'), duration: 'quarter' },
      { pitch: parsePitch('D5'), duration: 'quarter' },
    ],
  },
]
