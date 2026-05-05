import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

const SCORE_METADATA_D = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 2, // D Major
}

const SCORE_METADATA_A = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 3, // A Major
}

export const fingeringExercises: ExerciseData[] = [
  // First Finger Introduction
  {
    id: 'first-finger-b',
    name: 'Intro: B on A String',
    description: 'Place your 1st finger (B) on the A string.',
    category: 'Fingering',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_D,
    technicalTechnique: 'Fingering',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('A4'), duration: 4, annotations: { fingerNumber: undefined } },
      { pitch: parsePitch('B4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('A4'), duration: 4, annotations: { fingerNumber: undefined } },
      { pitch: parsePitch('B4'), duration: 4, annotations: { fingerNumber: 1 } },
    ],
  },
  {
    id: 'first-finger-e',
    name: 'Intro: E on D String',
    description: 'Place your 1st finger (E) on the D string.',
    category: 'Fingering',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_D,
    technicalTechnique: 'Fingering',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('D4'), duration: 4, annotations: { fingerNumber: undefined } },
      { pitch: parsePitch('E4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('D4'), duration: 4, annotations: { fingerNumber: undefined } },
      { pitch: parsePitch('E4'), duration: 4, annotations: { fingerNumber: 1 } },
    ],
  },

  // Second Finger Introduction
  {
    id: 'second-finger-c-sharp',
    name: 'High 2: C# on A String',
    description: 'Introduce the 2nd finger (C#) with a whole step from B.',
    category: 'Fingering',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_A,
    technicalTechnique: 'Fingering',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('B4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('C#5'), duration: 4, annotations: { fingerNumber: 2 } },
      { pitch: parsePitch('B4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('C#5'), duration: 4, annotations: { fingerNumber: 2 } },
    ],
  },
  {
    id: 'second-finger-f-sharp',
    name: 'High 2: F# on D String',
    description: 'Place your 2nd finger (F#) on the D string.',
    category: 'Fingering',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_D,
    technicalTechnique: 'Fingering',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('E4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('F#4'), duration: 4, annotations: { fingerNumber: 2 } },
      { pitch: parsePitch('E4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('F#4'), duration: 4, annotations: { fingerNumber: 2 } },
    ],
  },

  // 0-1-2 Patterns
  {
    id: 'pattern-012-a',
    name: 'Pattern: 0-1-2 on A',
    description: 'Combine open A, 1st, and 2nd fingers.',
    category: 'Fingering',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA_A,
    technicalTechnique: 'Fingering',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('B4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('C#5'), duration: 4, annotations: { fingerNumber: 2 } },
      { pitch: parsePitch('B4'), duration: 4, annotations: { fingerNumber: 1 } },
      { pitch: parsePitch('A4'), duration: 8 },
    ],
  }
]
