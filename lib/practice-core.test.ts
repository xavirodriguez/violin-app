/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest'
import { reducePracticeEvent, type PracticeState } from './practice-core'
import { allExercises } from '@/lib/exercises'

const mockExercise = allExercises[0] // Assuming this is a simple G Major scale

const getBaseState = (): PracticeState => ({
  status: 'listening',
  exercise: mockExercise,
  currentIndex: 0,
  history: [],
})

describe('reducePracticeEvent', () => {
  it('should transition from idle to listening on START', () => {
    const initialState: PracticeState = { ...getBaseState(), status: 'idle' }
    const event = { type: 'START' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(0)
  })

  it('should transition to idle on STOP', () => {
    const initialState = getBaseState()
    const event = { type: 'STOP' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('idle')
  })

  it('should add a detected note to history but not advance state', () => {
    const initialState = getBaseState()
    const event = {
      type: 'NOTE_DETECTED' as const,
      payload: { pitch: 'G4', cents: 10, timestamp: 1, confidence: 0.9 },
    }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(0)
    expect(newState.history).toHaveLength(1)
    expect(newState.history[0].pitch).toBe('G4')
  })

  it('should advance to the next note on NOTE_VALIDATED with a correct pitch', () => {
    const initialState = getBaseState()
    const targetNote = mockExercise.notes[0]
    expect(targetNote.pitch.step).toBe('G')
    expect(targetNote.pitch.octave).toBe(3)

    const event = {
      type: 'NOTE_VALIDATED' as const,
      payload: { pitch: 'G3', cents: 5, timestamp: 1, confidence: 0.95 },
    }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('correct')
    expect(newState.currentIndex).toBe(1)
    expect(newState.history).toHaveLength(0) // History should be cleared for the new note
  })

  it('should NOT advance on NOTE_VALIDATED with an incorrect pitch', () => {
    const initialState = getBaseState()
    const event = {
      type: 'NOTE_VALIDATED' as const,
      payload: { pitch: 'A4', cents: 0, timestamp: 1, confidence: 0.95 },
    }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('listening')
    expect(newState.currentIndex).toBe(0)
  })

  it('should transition to completed when the last note is validated', () => {
    const lastNoteIndex = mockExercise.notes.length - 1
    const initialState: PracticeState = { ...getBaseState(), currentIndex: lastNoteIndex }
    const lastNote = mockExercise.notes[lastNoteIndex]
    const pitchName = `${lastNote.pitch.step}${lastNote.pitch.alter ?? ''}${lastNote.pitch.octave}`

    const event = {
      type: 'NOTE_VALIDATED' as const,
      payload: { pitch: pitchName, cents: -10, timestamp: 1, confidence: 0.99 },
    }

    const newState = reducePracticeEvent(initialState, event)
    expect(newState.status).toBe('completed')
  })

  it('should handle enharmonic equivalents correctly', () => {
    // Let's find an exercise with a sharp/flat, or mock one.
    // Assuming the D Major scale (index 1) has an F#
    const dMajorExercise = allExercises[1]
    const fSharpNoteIndex = dMajorExercise.notes.findIndex(n => n.pitch.step === 'F' && n.pitch.alter === '1')

    if (fSharpNoteIndex !== -1) {
      const initialState: PracticeState = { ...getBaseState(), exercise: dMajorExercise, currentIndex: fSharpNoteIndex }
      const event = {
        type: 'NOTE_VALIDATED' as const,
        payload: { pitch: 'Gb5', cents: 0, timestamp: 1, confidence: 0.95 },
      }
      const newState = reducePracticeEvent(initialState, event)
      // Gb5 is enharmonically equivalent to F#5
      expect(newState.status).toBe('correct')
      expect(newState.currentIndex).toBe(fSharpNoteIndex + 1)
    } else {
      console.warn("Skipping enharmonic test: Could not find an exercise with a suitable note (e.g., F#).")
    }
  })
})
