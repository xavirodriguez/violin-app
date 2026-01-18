/**
 * Exercise data for song excerpts.
 */
import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

const SCORE_METADATA_C_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 0, // C Major / A Minor
}

const SCORE_METADATA_G_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 1, // G Major / E Minor
}

export const songsExercises: ExerciseData[] = [
  {
    id: 'twinkle-twinkle-first-phrase',
    name: 'Twinkle Twinkle Little Star (First Phrase)',
    description: "The iconic opening of a classic children's song.",
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_C_MAJOR,
    notes: [
      { pitch: parsePitch('G3'), duration: 'quarter' },
      { pitch: parsePitch('G3'), duration: 'quarter' },
      { pitch: parsePitch('D4'), duration: 'quarter' },
      { pitch: parsePitch('D4'), duration: 'quarter' },
    ],
  },
  {
    id: 'bile-em-cabbage-down-first-phrase',
    name: 'Bile Em Cabbage Down (First Phrase)',
    description: 'The opening phrase of a traditional fiddle tune.',
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_G_MAJOR,
    notes: [
      { pitch: parsePitch('A4'), duration: 'quarter' },
      { pitch: parsePitch('A4'), duration: 'quarter' },
      { pitch: parsePitch('G4'), duration: 'quarter' },
      { pitch: parsePitch('F#4'), duration: 'quarter' },
    ],
  },
  {
    id: 'ode-to-joy-first-phrase',
    name: 'Ode to Joy (First Phrase)',
    description: "The famous melody from Beethoven's 9th Symphony.",
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_G_MAJOR,
    notes: [
      { pitch: parsePitch('B4'), duration: 'quarter' },
      { pitch: parsePitch('B4'), duration: 'quarter' },
      { pitch: parsePitch('C5'), duration: 'quarter' },
      { pitch: parsePitch('D5'), duration: 'quarter' },
    ],
  },
]
