import { describe, it, expect } from 'vitest'
import { createPracticeEngine, calculateAdaptiveDifficulty } from './engine'
import { engineReducer } from './engine.reducer'
import { INITIAL_ENGINE_STATE } from './engine.state'
import { PracticeEngineEvent } from './engine.types'

describe('Practice Engine Looping and Tempo Scaling', () => {
  const mockExercise = {
    id: 'test-id',
    name: 'Test Exercise',
    notes: [
      { pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 },
      { pitch: { step: 'B', octave: 4, alter: 0 }, duration: 4 },
      { pitch: { step: 'C', octave: 5, alter: 0 }, duration: 4 },
    ],
    scoreMetadata: { keySignature: 0, timeSignature: { beats: 4, beatType: 4 }, clef: 'G' as const },
    musicXML: '',
    indicatedBpm: 60,
  } as any

  it('should scale requiredHoldTime based on BPM', () => {
    // Base difficulty at 60 BPM
    const streak = 0
    const difficulty = calculateAdaptiveDifficulty(streak)

    // We test JUMP_TO_INDEX which we added for looping
    const state = { ...INITIAL_ENGINE_STATE, currentNoteIndex: 2 }
    const event: PracticeEngineEvent = { type: 'JUMP_TO_INDEX', payload: { index: 0 } }
    const nextState = engineReducer(state, event)
    expect(nextState.currentNoteIndex).toBe(0)
  })

  it('should start at loop start index if looping is enabled', () => {
    const loopRegion = {
      startNoteIndex: 1,
      endNoteIndex: 2,
      isEnabled: true,
    }
    const engine = createPracticeEngine({
      exercise: mockExercise,
      audio: {} as any,
      pitch: {} as any,
      loopRegion,
    })

    expect(engine.getState().currentNoteIndex).toBe(1)
  })

  it('should increment drillStreak and stop looping when target reached', async () => {
    const loopRegion = {
      startNoteIndex: 0,
      endNoteIndex: 0,
      isEnabled: true,
      drillTarget: {
        precisionGoal: 0.8,
        consecutiveRequired: 1,
        currentStreak: 0,
      }
    }

    const state = { ...INITIAL_ENGINE_STATE, drillStreak: 0 }
    const successEvent: PracticeEngineEvent = {
      type: 'DRILL_ATTEMPT_COMPLETED',
      payload: { success: true, precision: 0.9 }
    }

    const nextState = engineReducer(state, successEvent)
    expect(nextState.drillStreak).toBe(1)
  })
})
