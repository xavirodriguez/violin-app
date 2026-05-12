import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { Exercise } from '../lib/domain/exercise'
import { NoteTechnique } from '../lib/technique-types'

const mockExercise: Exercise = {
  id: 'test-exercise',
  name: 'Test Exercise',
  difficulty: 'Beginner',
  category: 'Scales',
  notes: [
    { pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 },
    { pitch: { step: 'B', octave: 4, alter: 0 }, duration: 4 },
  ],
  musicXML: '',
}

describe('MVP Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePracticeStore.setState({
      status: 'idle',
      exercise: undefined,
      practiceState: undefined,
      error: undefined,
    })
  })

  it('should initialize and load an exercise correctly', () => {
    const store = usePracticeStore.getState()
    store.loadExercise(mockExercise)

    const state = usePracticeStore.getState()
    expect(state.exercise).toBeDefined()
    expect(state.exercise?.id).toBe('test-exercise')
    expect(state.practiceState?.currentIndex).toBe(0)
    expect(state.practiceState?.status).toBe('idle')
  })

  it('should advance to the next note when NOTE_MATCHED is dispatched', () => {
    const store = usePracticeStore.getState()
    store.loadExercise(mockExercise)

    // START to set status to 'listening'
    store.internalUpdate({ type: 'START' })

    // Simulate a note match
    store.internalUpdate({
      type: 'NOTE_MATCHED',
      payload: { technique: {} as unknown as NoteTechnique, isPerfect: true }
    })

    const state = usePracticeStore.getState()
    expect(state.practiceState?.currentIndex).toBe(1)
    expect(state.practiceState?.status).toBe('correct')
  })

  it('should complete the exercise after the last note is matched', () => {
    const store = usePracticeStore.getState()
    store.loadExercise(mockExercise)

    // START to set status to 'listening'
    store.internalUpdate({ type: 'START' })

    // Match first note
    store.internalUpdate({
      type: 'NOTE_MATCHED',
      payload: { technique: {} as unknown as NoteTechnique, isPerfect: true }
    })

    // Simulate detection of next note to transition from 'correct' to 'listening'
    store.internalUpdate({
      type: 'NOTE_DETECTED',
      payload: { pitch: 'B4', pitchHz: 493.88, cents: 0, timestamp: Date.now(), confidence: 1.0 }
    })

    // Match second (last) note
    store.internalUpdate({
      type: 'NOTE_MATCHED',
      payload: { technique: {} as unknown as NoteTechnique, isPerfect: true }
    })

    const state = usePracticeStore.getState()
    expect(state.practiceState?.status).toBe('completed')
  })
})
