/**
 * OpenStringsExercises
 * Exercise definitions focused on playing open strings (G, D, A, E)
 * with a steady tone and correct posture.
 *
 * @remarks
 * These exercises are designed for absolute beginners to establish basic
 * bowing technique and ear training without the complexity of left-hand fingering.
 */

import type { ExerciseData } from '../types'
import { parsePitch } from '../utils'

/** Shared metadata for all open string exercises. @internal */
const SCORE_METADATA = {
  clef: 'G' as const,
  timeSignature: { beats: 4, beatType: 4 },
  keySignature: 0, // C Major / A Minor
}

/**
 * List of beginner exercises for open strings.
 */
export const openStringsExercises: ExerciseData[] = [
  {
    id: 'open-g-string',
    name: 'Open G String',
    description: 'Practice playing the open G string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'General',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 4 },
      { pitch: parsePitch('G3'), duration: 4 },
    ],
  },
  {
    id: 'open-d-string',
    name: 'Open D String',
    description: 'Practice playing the open D string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'General',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
      { pitch: parsePitch('D4'), duration: 4 },
    ],
  },
  {
    id: 'open-a-string',
    name: 'Open A String',
    description: 'Practice playing the open A string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: ['Open A'],
    estimatedDuration: '1 min',
    technicalTechnique: 'Intonation',
    recommended: true,
    indicatedBpm: 60,
    referenceAudioUrl: 'https://cdn.violinmentor.com/audio/open-a-string.mp3',
    audioReferenceMap: {
      exerciseId: 'open-a-string',
      audioUrl: 'https://cdn.violinmentor.com/audio/open-a-string.mp3',
      noteTimestamps: [
        { noteIndex: 0, startMs: 0, endMs: 1000, pitch: 'A4', sampleUrl: 'https://cdn.violinmentor.com/audio/samples/a4.mp3' },
        { noteIndex: 1, startMs: 1000, endMs: 2000, pitch: 'A4', sampleUrl: 'https://cdn.violinmentor.com/audio/samples/a4.mp3' },
        { noteIndex: 2, startMs: 2000, endMs: 3000, pitch: 'A4', sampleUrl: 'https://cdn.violinmentor.com/audio/samples/a4.mp3' },
        { noteIndex: 3, startMs: 3000, endMs: 4000, pitch: 'A4', sampleUrl: 'https://cdn.violinmentor.com/audio/samples/a4.mp3' },
      ]
    },
    notes: [
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
      { pitch: parsePitch('A4'), duration: 4 },
    ],
  },
  {
    id: 'open-e-string',
    name: 'Open E String',
    description: 'Practice playing the open E string with a steady tone.',
    category: 'Open Strings',
    difficulty: 'Beginner',
    scoreMetadata: SCORE_METADATA,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'General',
    indicatedBpm: 60,
    notes: [
      { pitch: parsePitch('E5'), duration: 4 },
      { pitch: parsePitch('E5'), duration: 4 },
      { pitch: parsePitch('E5'), duration: 4 },
      { pitch: parsePitch('E5'), duration: 4 },
    ],
  },
]
