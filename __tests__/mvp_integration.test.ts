import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { Exercise } from '../lib/exercises/types'

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
})
