import { describe, it, expect, beforeEach } from 'vitest'
import { MusicalNote, formatPitchName, isMatch, reducePracticeEvent } from './practice-core'
import { type PracticeState } from '@/lib/domain/practice'

describe('formatPitchName', () => {
  it('should format natural notes correctly', () => {
    expect(formatPitchName({ step: 'A', octave: 4, alter: 0 })).toBe('A4')
  })

  it('should format sharp notes correctly', () => {
    expect(formatPitchName({ step: 'C', octave: 5, alter: 1 })).toBe('C#5')
  })

  it('should format flat notes correctly', () => {
    expect(formatPitchName({ step: 'B', octave: 3, alter: -1 })).toBe('Bb3')
  })
})

describe('isMatch', () => {
  const target = { pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 } as any

  it('should match exact note and octave', () => {
    const detected = { pitch: 'A4', cents: 0 } as any
    expect(isMatch({ target, detected })).toBe(true)
  })

  it('should not match different note', () => {
    const detected = { pitch: 'G4', cents: 0 } as any
    expect(isMatch({ target, detected })).toBe(false)
  })

  it('should match enharmonics', () => {
    const targetSharp = { pitch: { step: 'C', octave: 4, alter: 1 }, duration: 4 } as any
    const detectedFlat = { pitch: 'Db4', cents: 0 } as any
    expect(isMatch({ target: targetSharp, detected: detectedFlat })).toBe(true)
  })

  it('should fail if cents deviation is too high', () => {
    const detected = { pitch: 'A4', cents: 30 } as any
    expect(isMatch({ target, detected, tolerance: 25 })).toBe(false)
  })
})

describe('reducePracticeEvent', () => {
  const mockExercise = { id: 'ex1', notes: [{ pitch: 'A4' }, { pitch: 'B4' }] } as any
  const initialState: PracticeState = {
    status: 'idle',
    currentIndex: 0,
    exercise: mockExercise,
    detectionHistory: [],
    holdDuration: 0,
  }

  it('should transition to listening on START', () => {
    const next = reducePracticeEvent(initialState, { type: 'START' })
    expect(next.status).toBe('listening')
  })

  it('should advance index on NOTE_MATCHED', () => {
    const listening = { ...initialState, status: 'listening' } as any
    const next = reducePracticeEvent(listening, { type: 'NOTE_MATCHED', payload: {} as any })
    expect(next.currentIndex).toBe(1)
    expect(next.status).toBe('correct')
  })

  it('should complete on last note', () => {
    const lastNote = { ...initialState, status: 'listening', currentIndex: 1 } as any
    const next = reducePracticeEvent(lastNote, { type: 'NOTE_MATCHED', payload: {} as any })
    expect(next.status).toBe('completed')
  })
})
