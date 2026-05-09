import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { ERROR_CODES } from '../lib/errors/app-error'

// Mocking dependencies to avoid real audio/tuner interactions
vi.mock('../lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('PracticeStore loadExercise integration (TASK-03)', () => {
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
    notes: [{ pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 }],
  }

  beforeEach(() => {
    usePracticeStore.getState().reset()
  })

  it('should load a valid exercise correctly', () => {
    const store = usePracticeStore.getState()
    // @ts-expect-error - testing with partial exercise
    store.loadExercise(baseExercise)

    expect(usePracticeStore.getState().practiceState?.status).toBe('idle')
    expect(usePracticeStore.getState().exercise?.id).toBe('test-id')
    expect(usePracticeStore.getState().error).toBeUndefined()
  })

  it('should transition to error state when loading an invalid exercise', () => {
    const invalidExercise = {
      ...baseExercise,
      notes: [{ pitch: { step: 'A', octave: 4, alter: 2 }, duration: 4 }],
    }

    const store = usePracticeStore.getState()
    // @ts-expect-error - testing with invalid exercise
    store.loadExercise(invalidExercise)

    const state = usePracticeStore.getState()
    expect(state.status).toBe('error')
    expect(state.error?.code).toBe(ERROR_CODES.INVALID_EXERCISE)
    expect(state.error?.message).toMatch(/invalid accidental alter=2/i)
  })

  it('should reject exercise with no notes', () => {
    const invalidExercise = {
      ...baseExercise,
      notes: [],
    }

    const store = usePracticeStore.getState()
    // @ts-expect-error - testing with invalid exercise
    store.loadExercise(invalidExercise)

    const state = usePracticeStore.getState()
    expect(state.status).toBe('error')
    expect(state.error?.code).toBe(ERROR_CODES.INVALID_EXERCISE)
    expect(state.error?.message).toContain('at least one note')
  })
})
