/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { reducePracticeEvent, type PracticeState } from './practice-core'
import { allExercises } from './exercises'

// Mock data for testing
const mockExercise = allExercises[0] // Assuming this has at least 2 notes

const getInitialState = (
  status: PracticeState['status'] = 'idle',
  currentIndex = 0,
): PracticeState => ({
  status,
  exercise: mockExercise,
  currentIndex,
  detectionHistory: [],
})

describe('reducePracticeEvent', () => {
  it('should transition from idle to listening on START event', () => {
    const initialState = getInitialState('idle')
    const event = { type: 'START' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(0)
    expect(newState.detectionHistory).toEqual([])
  })

  it('should transition from listening to idle on STOP event', () => {
    const initialState = getInitialState('listening')
    const event = { type: 'STOP' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('idle')
  })

  it('should transition from any state to idle on RESET event', () => {
    const listeningState = getInitialState('listening')
    const completedState = getInitialState('completed')
    const event = { type: 'RESET' as const }
    expect(reducePracticeEvent(listeningState, event).status).toBe('idle')
    expect(reducePracticeEvent(completedState, event).status).toBe('idle')
  })

  it('should add detected note to history on NOTE_DETECTED event', () => {
    const initialState = getInitialState('listening')
    const detectedNote = { pitch: 'A4', cents: 5, timestamp: Date.now(), confidence: 0.9 }
    const event = { type: 'NOTE_DETECTED' as const, payload: detectedNote }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.detectionHistory).toEqual([detectedNote])
  })

  it('should clear history on NO_NOTE_DETECTED event', () => {
    const initialState = getInitialState('listening')
    initialState.detectionHistory.push({
      pitch: 'A4',
      cents: 5,
      timestamp: Date.now(),
      confidence: 0.9,
    })
    const event = { type: 'NO_NOTE_DETECTED' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.detectionHistory).toEqual([])
  })

  it('should advance to the next note on NOTE_MATCHED when listening', () => {
    const initialState = getInitialState('listening', 0)
    const event = { type: 'NOTE_MATCHED' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.currentIndex).toBe(1)
    expect(newState.status).toBe('listening')
  })

  it('should not advance note on NOTE_MATCHED when not listening', () => {
    const initialState = getInitialState('idle', 0)
    const event = { type: 'NOTE_MATCHED' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.currentIndex).toBe(0)
  })

  it('should transition to completed state on NOTE_MATCHED for the last note', () => {
    const lastNoteIndex = mockExercise.notes.length - 1
    const initialState = getInitialState('listening', lastNoteIndex)
    const event = { type: 'NOTE_MATCHED' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('completed')
    expect(newState.currentIndex).toBe(lastNoteIndex) // Index should not go out of bounds
  })

  it('should clear detection history after a successful match', () => {
    const initialState = getInitialState('listening', 0)
    initialState.detectionHistory.push({
      pitch: 'G4',
      cents: 2,
      timestamp: Date.now(),
      confidence: 0.95,
    })
    const event = { type: 'NOTE_MATCHED' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.detectionHistory).toEqual([])
  })
})
