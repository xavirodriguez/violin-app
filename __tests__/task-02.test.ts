import { describe, it, expect } from 'vitest'
import { validateExercise } from '../lib/exercises/validation'
import { ERROR_CODES } from '../lib/errors/app-error'

describe('validateExercise semantic validation (TASK-02)', () => {
  const baseExercise = {
    id: 'test-id',
    name: 'Test Exercise',
    description: 'Description',
    category: 'Scales',
    difficulty: 'Beginner',
    scoreMetadata: {
      clef: 'G',
      timeSignature: { beats: 4, beatType: 4 },
      keySignature: 0,
    },
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'Intonation',
    musicXML: '<xml></xml>',
  }

  it('should accept a valid exercise', () => {
    const validExercise = {
      ...baseExercise,
      notes: [
        { pitch: { step: 'C', octave: 4, alter: 0 }, duration: 4 },
        { pitch: { step: 'D', octave: 4, alter: 1 }, duration: 4 },
      ],
    }
    expect(() => validateExercise(validExercise)).not.toThrow()
  })

  it('should reject exercise with no notes', () => {
    const invalidExercise = {
      ...baseExercise,
      notes: [],
    }
    expect(() => validateExercise(invalidExercise)).toThrow(/must contain at least one note/i)
  })

  it('should reject invalid alter', () => {
    const invalidExercise = {
      ...baseExercise,
      notes: [
        { pitch: { step: 'C', octave: 4, alter: 2 }, duration: 4 },
      ],
    }
    expect(() => validateExercise(invalidExercise)).toThrow(/invalid accidental alter=2 at note index 0/i)

    const invalidExercise2 = {
        ...baseExercise,
        notes: [
          { pitch: { step: 'C', octave: 4, alter: 0 }, duration: 4 },
          { pitch: { step: 'D', octave: 4, alter: -2 }, duration: 4 },
        ],
      }
      expect(() => validateExercise(invalidExercise2)).toThrow(/invalid accidental alter=-2 at note index 1/i)
  })

  it('should reject invalid octave', () => {
    const invalidExercise = {
      ...baseExercise,
      notes: [
        { pitch: { step: 'C', octave: 2, alter: 0 }, duration: 4 },
      ],
    }
    expect(() => validateExercise(invalidExercise)).toThrow(/invalid octave=2 at note index 0/i)

    const invalidExercise2 = {
      ...baseExercise,
      notes: [
        { pitch: { step: 'C', octave: 8, alter: 0 }, duration: 4 },
      ],
    }
    expect(() => validateExercise(invalidExercise2)).toThrow(/invalid octave=8 at note index 0/i)
  })

  it('should reject invalid duration', () => {
    const invalidExercise = {
      ...baseExercise,
      notes: [
        { pitch: { step: 'C', octave: 4, alter: 0 }, duration: 5 },
      ],
    }
    expect(() => validateExercise(invalidExercise)).toThrow(/invalid duration=5 at note index 0/i)
  })

  it('should throw AppError with INVALID_EXERCISE code', () => {
    const invalidExercise = {
      ...baseExercise,
      notes: [],
    }
    try {
      validateExercise(invalidExercise)
    } catch (err: any) {
      expect(err.code).toBe(ERROR_CODES.INVALID_EXERCISE)
    }
  })
})
