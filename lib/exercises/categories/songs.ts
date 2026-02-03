/**
 * SongExercises
 * Short musical excerpts from popular songs and traditional tunes.
 *
 * @remarks
 * These exercises allow students to apply their technical skills (intonation,
 * rhythm, string crossing) to recognizable melodies, increasing engagement
 * and musicality.
 */

import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

/** Shared metadata for C Major songs. @internal */
const SCORE_METADATA_C_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 0, // C Major / A Minor
}

/** Shared metadata for G Major songs. @internal */
const SCORE_METADATA_G_MAJOR = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 1, // G Major / E Minor
}

/**
 * List of beginner exercises featuring song fragments.
 */
export const songsExercises: ExerciseData[] = [
  {
    id: 'twinkle-twinkle-full',
    name: 'Twinkle Twinkle Little Star (Full)',
    description: 'Complete version of the classic children’s melody.',
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_C_MAJOR,
    technicalGoals: [],
    estimatedDuration: '2 min',
    technicalTechnique: 'General',
    notes: [
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 8 },
  
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('B3'), duration: 4 },
      { pitch: parsePitch('B3'), duration: 4 },
  
      { pitch: parsePitch('A3'), duration: 4 },
      { pitch: parsePitch('A3'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 8 },
  
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
  
      { pitch: parsePitch('B3'), duration: 4 },
      { pitch: parsePitch('B3'), duration: 4 },
      { pitch: parsePitch('A3'), duration: 8 },
  
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
  
      { pitch: parsePitch('B3'), duration: 4 },
      { pitch: parsePitch('B3'), duration: 4 },
      { pitch: parsePitch('A3'), duration: 8 },
  
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 8 },
  
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('B3'), duration: 4 },
      { pitch: parsePitch('B3'), duration: 4 },
  
      { pitch: parsePitch('A3'), duration: 4 },
      { pitch: parsePitch('A3'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 8 },
    ],
  },
  
  {
    id: 'bile-em-cabbage-down-first-phrase',
    name: 'Bile Em Cabbage Down (First Phrase)',
    description: 'The opening phrase of a traditional fiddle tune.',
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_G_MAJOR,
    technicalGoals: [], estimatedDuration: "1 min", technicalTechnique: "General", notes: [
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 4 },
      { pitch: parsePitch('F#4'), duration: 4 },
    ],
  },
  {
    id: 'ode-to-joy-full',
    name: 'Ode to Joy (Full)',
    description: 'Complete theme from Beethoven’s 9th Symphony.',
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_G_MAJOR,
    technicalGoals: [],
    estimatedDuration: '2 min',
    technicalTechnique: 'General',
    notes: [
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('C5'), duration: 4 },
      { pitch: parsePitch('D5'), duration: 4 },
  
      { pitch: parsePitch('D5'), duration: 4 },
      { pitch: parsePitch('C5'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
  
      { pitch: parsePitch('G4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
  
      { pitch: parsePitch('B4'), duration: 6 },
      { pitch: parsePitch('A4'), duration: 2 },
      { pitch: parsePitch('A4'), duration: 8 },
  
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('C5'), duration: 4 },
      { pitch: parsePitch('D5'), duration: 4 },
  
      { pitch: parsePitch('D5'), duration: 4 },
      { pitch: parsePitch('C5'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
  
      { pitch: parsePitch('G4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4 },
  
      { pitch: parsePitch('A4'), duration: 6 },
      { pitch: parsePitch('G4'), duration: 2 },
      { pitch: parsePitch('G4'), duration: 8 },
    ],
  },
  {
    id: 'mary-had-a-little-lamb-full',
    name: 'Mary Had a Little Lamb (Full)',
    description: 'Traditional children’s song, ideal for string crossing.',
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_C_MAJOR,
    technicalGoals: [],
    estimatedDuration: '1.5 min',
    technicalTechnique: 'General',
    notes: [
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 8 },
  
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 8 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 8 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
  
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
  
      { pitch: parsePitch('C4'), duration: 16 },
    ],
  },
  {
    id: 'frere-jacques-full',
    name: 'Frère Jacques (Full)',
    description: 'Traditional French round, perfect for intonation and memory.',
    category: 'Songs',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_C_MAJOR,
    technicalGoals: [],
    estimatedDuration: '2 min',
    technicalTechnique: 'General',
    notes: [
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
  
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('F4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 8 },
  
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('F4'), duration: 4 },
      { pitch: parsePitch('G4'), duration: 8 },
  
      { pitch: parsePitch('G4'), duration: 2 },
      { pitch: parsePitch('A4'), duration: 2 },
      { pitch: parsePitch('G4'), duration: 2 },
      { pitch: parsePitch('F4'), duration: 2 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
  
      { pitch: parsePitch('G4'), duration: 2 },
      { pitch: parsePitch('A4'), duration: 2 },
      { pitch: parsePitch('G4'), duration: 2 },
      { pitch: parsePitch('F4'), duration: 2 },
      { pitch: parsePitch('E4'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 4 },
  
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 8 },
  
      { pitch: parsePitch('C4'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('C4'), duration: 8 },
    ],
  },
    
  
]
