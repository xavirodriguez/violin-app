/**
 * Exercise data for open string exercises.
 */
import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

const SCORE_METADATA = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 0, // C Major / A Minor
}

export const openStringsExercises: ExerciseData[] = [
  {
    id: 'open-g-string',
    name: 'Open G String',
    description: 'Practice playing the open G string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    notes: [
      { pitch: parsePitch('G3'), duration: 'quarter' },
      { pitch: parsePitch('G3'), duration: 'quarter' },
      { pitch: parsePitch('G3'), duration: 'quarter' },
      { pitch: parsePitch('G3'), duration: 'quarter' },
    ],
  },
  {
    id: 'open-d-string',
    name: 'Open D String',
    description: 'Practice playing the open D string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    notes: [
      { pitch: parsePitch('D4'), duration: 'quarter' },
      { pitch: parsePitch('D4'), duration: 'quarter' },
      { pitch: parsePitch('D4'), duration: 'quarter' },
      { pitch: parsePitch('D4'), duration: 'quarter' },
    ],
  },
  {
    id: 'open-a-string',
    name: 'Open A String',
    description: 'Practice playing the open A string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    notes: [
      { pitch: parsePitch('A4'), duration: 'quarter' },
      { pitch: parsePitch('A4'), duration: 'quarter' },
      { pitch: parsePitch('A4'), duration: 'quarter' },
      { pitch: parsePitch('A4'), duration: 'quarter' },
    ],
  },
  {
    id: 'open-e-string',
    name: 'Open E String',
    description: 'Practice playing the open E string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    notes: [
      { pitch: parsePitch('E5'), duration: 'quarter' },
      { pitch: parsePitch('E5'), duration: 'quarter' },
      { pitch: parsePitch('E5'), duration: 'quarter' },
      { pitch: parsePitch('E5'), duration: 'quarter' },
    ],
  },
]
