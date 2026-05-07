import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

/** Shared metadata for beginner rhythm exercises. @internal */
const SCORE_METADATA = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 0,
}

export const rhythmExercises: ExerciseData[] = [
  {
    id: 'rhythm-a-quarter',
    name: 'A String: Quarter Notes',
    description: 'Practice steady quarter notes on the open A string.',
    category: 'Rhythm',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: ['Steady Bow'],
    estimatedDuration: '1 min',
    technicalTechnique: 'Rhythm',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
    ],
  },
  {
    id: 'rhythm-d-half',
    name: 'D String: Half Notes',
    description: 'Focus on long, smooth bow strokes with half notes.',
    category: 'Rhythm',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: ['Bow Distribution'],
    estimatedDuration: '1 min',
    technicalTechnique: 'Rhythm',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('D4'), duration: 8 },
      { pitch: parsePitch('D4'), duration: 8 },
    ],
  },
  {
    id: 'rhythm-mixed-open',
    name: 'Mixed Open Rhythms',
    description: 'Combine quarter and half notes on open G and D.',
    category: 'Rhythm',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: ['Rhythm Switching'],
    estimatedDuration: '1 min',
    technicalTechnique: 'Rhythm',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('G3'), duration: 8 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
    ],
  }
]
