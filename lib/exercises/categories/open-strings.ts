import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

const SCORE_METADATA = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 0,
}

export const openStringsExercises: ExerciseData[] = [
  {
    id: 'open-g-string',
    name: 'Open G String',
    description: 'Practice playing the open G string.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'General',
    indicatedBpm: 60,
    notes: [{ pitch: parsePitch('G3'), duration: 4 }],
  },
  {
    id: 'open-d-string',
    name: 'Open D String',
    description: 'Practice playing the open D string.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'General',
    indicatedBpm: 60,
    notes: [{ pitch: parsePitch('D4'), duration: 4 }],
  },
  {
    id: 'open-a-string',
    name: 'Open A String',
    description: 'Practice playing the open A string.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'Intonation',
    indicatedBpm: 60,
    notes: [{ pitch: parsePitch('A4'), duration: 4 }],
  },
  {
    id: 'open-e-string',
    name: 'Open E String',
    description: 'Practice playing the open E string.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'General',
    indicatedBpm: 60,
    notes: [{ pitch: parsePitch('E5'), duration: 4 }],
  },
]
