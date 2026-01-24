/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  reducePracticeEvent,
  type PracticeState,
  type PracticeEvent,
  type DetectedNote,
} from './practice-core'
import { allExercises } from '@/lib/exercises'

// Mock exercise for testing
const mockExercise = allExercises[0] // G Major Scale

const getInitialState = (): PracticeState => ({
  status: 'idle',
  exercise: JSON.parse(JSON.stringify(mockExercise)),
  currentIndex: 0,
  detectionHistory: [],
})

describe('practice-core reducer', () => {
  it('should transition to "listening" on START event', () => {
    const initialState = getInitialState()
    const event: PracticeEvent = { type: 'START' }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(0)
  })

  it('should add a note to history on NOTE_DETECTED', () => {
    let state = getInitialState()
    state = reducePracticeEvent(state, { type: 'START' }) // Start listening

    const detectedNote: DetectedNote = {
      pitch: 'G4',
      cents: 5,
      timestamp: 1000,
      confidence: 0.9,
    }
    const event: PracticeEvent = { type: 'NOTE_DETECTED', payload: detectedNote }
    const newState = reducePracticeEvent(state, event)

    expect(newState.status).toBe('listening') // Stays in listening
    expect(newState.detectionHistory).toContain(detectedNote)
    expect(newState.detectionHistory).toHaveLength(1)
  })

  it('should advance to the next note on NOTE_MATCHED', () => {
    let state = getInitialState()
    state = reducePracticeEvent(state, { type: 'START' })

    const event: PracticeEvent = { type: 'NOTE_MATCHED' }
    const newState = reducePracticeEvent(state, event)

    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(1)
    expect(newState.detectionHistory).toHaveLength(0) // History is cleared for the new note
  })

  it('should transition to "completed" when the last note is matched', () => {
    let state = getInitialState()
    state.status = 'listening'
    // Manually set the state to be on the last note
    state.currentIndex = mockExercise.notes.length - 1

    const event: PracticeEvent = { type: 'NOTE_MATCHED' }
    const finalState = reducePracticeEvent(state, event)

    expect(finalState.status).toBe('completed')
  })

  it('should do nothing if NOTE_MATCHED is received in the wrong state', () => {
    const state = getInitialState() // status: 'idle'
    const event: PracticeEvent = { type: 'NOTE_MATCHED' }
    const newState = reducePracticeEvent(state, event)
    expect(newState).toBe(state) // Should return the exact same state object
  })
})
