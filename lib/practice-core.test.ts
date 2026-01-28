/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  reducePracticeEvent,
  type PracticeState,
  formatPitchName,
  type TargetNote,
  MusicalNote,
  isMatch,
} from './practice-core'
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

describe('formatPitchName', () => {
  it('should handle numeric alter values correctly', () => {
    const pitch: TargetNote['pitch'] = { step: 'C', octave: 4, alter: 1 }
    expect(formatPitchName(pitch)).toBe('C#4')
  })

  it('should handle string alter values correctly', () => {
    const pitch: TargetNote['pitch'] = { step: 'D', octave: 4, alter: 'flat' }
    expect(formatPitchName(pitch)).toBe('Db4')
  })

  it('should handle double sharp/flat values', () => {
    const pitch1: TargetNote['pitch'] = { step: 'E', octave: 4, alter: '##' }
    const pitch2: TargetNote['pitch'] = { step: 'F', octave: 4, alter: -2 }
    expect(formatPitchName(pitch1)).toBe('E##4')
    expect(formatPitchName(pitch2)).toBe('Fbb4')
  })

  it('should handle no alter value', () => {
    const pitch: TargetNote['pitch'] = { step: 'G', octave: 4 }
    expect(formatPitchName(pitch)).toBe('G4')
  })

  it('should throw an error for unsupported alter values', () => {
    const pitch: TargetNote['pitch'] = { step: 'A', octave: 4, alter: 3 as any }
    expect(() => formatPitchName(pitch)).toThrow('Unsupported alter value: 3')
  })
})

describe('MusicalNote Enharmonic Equivalents', () => {
  it('should treat C#4 and Db4 as equivalent', () => {
    const cSharp = MusicalNote.fromName('C#4')
    const dFlat = MusicalNote.fromName('Db4')
    expect(cSharp.isEnharmonic(dFlat)).toBe(true)
    expect(cSharp.midiNumber).toBe(dFlat.midiNumber)
  })

  it('should handle Cb4 as equivalent to B3', () => {
    const cFlat = MusicalNote.fromName('Cb4')
    const bNatural = MusicalNote.fromName('B3')
    expect(cFlat.isEnharmonic(bNatural)).toBe(true)
    expect(cFlat.midiNumber).toBe(bNatural.midiNumber)
  })

  it('should handle B#3 as equivalent to C4', () => {
    const bSharp = MusicalNote.fromName('B#3')
    const cNatural = MusicalNote.fromName('C4')
    expect(bSharp.isEnharmonic(cNatural)).toBe(true)
    expect(bSharp.midiNumber).toBe(cNatural.midiNumber)
  })

  it('should handle E#4 as equivalent to F4', () => {
    const eSharp = MusicalNote.fromName('E#4')
    const fNatural = MusicalNote.fromName('F4')
    expect(eSharp.isEnharmonic(fNatural)).toBe(true)
    expect(eSharp.midiNumber).toBe(fNatural.midiNumber)
  })

  it('should handle Fb4 as equivalent to E4', () => {
    const fFlat = MusicalNote.fromName('Fb4')
    const eNatural = MusicalNote.fromName('E4')
    expect(fFlat.isEnharmonic(eNatural)).toBe(true)
    expect(fFlat.midiNumber).toBe(eNatural.midiNumber)
  })
})

describe('MusicalNote Edge Cases', () => {
  it('should handle negative MIDI numbers correctly', () => {
    const note = MusicalNote.fromMidi(-1)
    expect(note.noteName).toBe('B')
    expect(note.octave).toBe(-2)
  })

  it('should throw an error for invalid frequencies', () => {
    expect(() => MusicalNote.fromFrequency(NaN)).toThrow('Invalid frequency: NaN')
    expect(() => MusicalNote.fromFrequency(Infinity)).toThrow('Invalid frequency: Infinity')
    expect(() => MusicalNote.fromFrequency(0)).toThrow('Invalid frequency: 0')
    expect(() => MusicalNote.fromFrequency(-1)).toThrow('Invalid frequency: -1')
  })

  it('should throw an error for invalid MIDI numbers', () => {
    expect(() => MusicalNote.fromMidi(NaN)).toThrow('Invalid MIDI number: NaN')
    expect(() => MusicalNote.fromMidi(Infinity)).toThrow('Invalid MIDI number: Infinity')
  })

  it('should throw an error for malformed note names', () => {
    expect(() => MusicalNote.fromName('H4')).toThrow('Invalid note name format: "H4"')
    expect(() => MusicalNote.fromName('C#')).toThrow('Invalid note name format: "C#"')
    expect(() => MusicalNote.fromName('C4#')).toThrow('Invalid note name format: "C4#"')
  })
})

describe('isMatch', () => {
  const target: TargetNote = {
    pitch: { step: 'A', octave: 4, alter: 0 },
    duration: 1,
  }

  it('should return true for a correct match', () => {
    const detected = { pitch: 'A4', cents: 0, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detected)).toBe(true)
  })

  it('should return true for an enharmonic match', () => {
    const enharmonicTarget: TargetNote = {
      pitch: { step: 'C', octave: 4, alter: 1 },
      duration: 1,
    }
    const detected = { pitch: 'Db4', cents: 0, timestamp: 0, confidence: 1 }
    expect(isMatch(enharmonicTarget, detected)).toBe(true)
  })

  it('should return false if cents are out of tolerance', () => {
    const detected = { pitch: 'A4', cents: 30, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detected, 25)).toBe(false)
  })

  it('should return true if cents are within tolerance', () => {
    const detected = { pitch: 'A4', cents: 24, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detected, 25)).toBe(true)
  })

  it('should rethrow parsing errors for invalid target notes', () => {
    const invalidTarget: TargetNote = {
      pitch: { step: 'C', octave: 4, alter: 7 as any },
      duration: 1,
    }
    const detected = { pitch: 'A4', cents: 0, timestamp: 0, confidence: 1 }
    expect(() => isMatch(invalidTarget, detected)).toThrow('Unsupported alter value: 7')
  })
})
