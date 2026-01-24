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
  // DEEP COPY the exercise object to prevent state leakage between tests.
  // This was the root cause of the persistent test failures.
  exercise: JSON.parse(JSON.stringify(mockExercise)),
  currentIndex: 0,
  history: [],
  validationStartTime: null,
})

describe('practice-core reducer', () => {
  it('should transition to "listening" on START event', () => {
    const initialState = getInitialState()
    const event: PracticeEvent = { type: 'START' }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(0)
  })

  it('should transition to "validating" when the correct note is detected', () => {
    let state = getInitialState()
    state = reducePracticeEvent(state, { type: 'START' }) // Start listening

    const correctNote: DetectedNote = {
      pitch: 'G4',
      cents: 5,
      timestamp: 1000,
      confidence: 0.9,
    }
    const event: PracticeEvent = { type: 'NOTE_DETECTED', payload: correctNote }
    const newState = reducePracticeEvent(state, event)

    expect(newState.status).toBe('validating')
    expect(newState.validationStartTime).toBe(1000)
    expect(newState.history).toContain(correctNote)
  })

  it('should not advance if an incorrect note is detected', () => {
    let state = getInitialState()
    state = reducePracticeEvent(state, { type: 'START' })

    const incorrectNote: DetectedNote = {
      pitch: 'A4', // Target is G4
      cents: 0,
      timestamp: 1000,
      confidence: 0.9,
    }
    const event: PracticeEvent = { type: 'NOTE_DETECTED', payload: incorrectNote }
    const newState = reducePracticeEvent(state, event)

    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(0)
  })

  it('should not advance if the correct note is held for less than the required time', () => {
    let state = getInitialState()
    state = reducePracticeEvent(state, { type: 'START' })

    // First detection starts validation
    const firstNote: DetectedNote = { pitch: 'G4', cents: 2, timestamp: 1000, confidence: 0.9 }
    state = reducePracticeEvent(state, { type: 'NOTE_DETECTED', payload: firstNote })
    expect(state.status).toBe('validating')

    // Second detection is within the hold time
    const secondNote: DetectedNote = { pitch: 'G4', cents: 3, timestamp: 1499, confidence: 0.9 }
    const newState = reducePracticeEvent(state, { type: 'NOTE_DETECTED', payload: secondNote })

    expect(newState.status).toBe('validating')
    expect(newState.currentIndex).toBe(0) // Did not advance
  })

  it('should advance to the next note when the correct note is held for the required time', () => {
    let state = getInitialState()
    state = reducePracticeEvent(state, { type: 'START' })

    const requiredHoldTime = 500

    // First detection starts validation
    const firstNote: DetectedNote = { pitch: 'G4', cents: 2, timestamp: 1000, confidence: 0.9 }
    state = reducePracticeEvent(state, { type: 'NOTE_DETECTED', payload: firstNote })
    expect(state.status).toBe('validating')

    // Second detection meets the hold time
    const secondNote: DetectedNote = { pitch: 'G4', cents: 3, timestamp: 1500, confidence: 0.9 }
    const newState = reducePracticeEvent(
      state,
      { type: 'NOTE_DETECTED', payload: secondNote },
      requiredHoldTime,
    )

    expect(newState.status).toBe('correct')
    expect(newState.currentIndex).toBe(1)
    expect(newState.validationStartTime).toBeNull()
  })

  it('should transition to "completed" after the last note is correctly played', () => {
    let state = getInitialState()
    // Manually set the state to be on the last note
    const lastNoteIndex = mockExercise.notes.length - 1
    const lastNoteTarget = mockExercise.notes[lastNoteIndex] // This is the full Note object

    // Construct the pitch string from the target object for the test's DetectedNote
    const lastNotePitchName = `${lastNoteTarget.pitch.step}${lastNoteTarget.pitch.alter ?? ''}${lastNoteTarget.pitch.octave}`

    state.currentIndex = lastNoteIndex
    state.status = 'listening'

    const requiredHoldTime = 500

    // First detection of the last note
    const firstNote: DetectedNote = {
      pitch: lastNotePitchName,
      cents: 0,
      timestamp: 1000,
      confidence: 0.9,
    }
    state = reducePracticeEvent(
      state,
      { type: 'NOTE_DETECTED', payload: firstNote },
      requiredHoldTime,
    )
    expect(state.status).toBe('validating')

    // Second detection of the last note, completing the hold
    const secondNote: DetectedNote = {
      pitch: lastNotePitchName,
      cents: 0,
      timestamp: 1500,
      confidence: 0.9,
    }
    const finalState = reducePracticeEvent(
      state,
      { type: 'NOTE_DETECTED', payload: secondNote },
      requiredHoldTime,
    )

    expect(finalState.status).toBe('completed')
  })

  it('should reset validation if a wrong note is played during validation', () => {
    let state = getInitialState()
    state = reducePracticeEvent(state, { type: 'START' })

    // Start validating with correct note
    const correctNote: DetectedNote = { pitch: 'G4', cents: 1, timestamp: 1000, confidence: 0.9 }
    state = reducePracticeEvent(state, { type: 'NOTE_DETECTED', payload: correctNote })
    expect(state.status).toBe('validating')

    // Then play a wrong note
    const incorrectNote: DetectedNote = { pitch: 'A4', cents: 1, timestamp: 1200, confidence: 0.9 }
    const newState = reducePracticeEvent(state, { type: 'NOTE_DETECTED', payload: incorrectNote })

    expect(newState.status).toBe('listening')
    expect(newState.validationStartTime).toBeNull()
  })
})
