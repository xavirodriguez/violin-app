// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import {
  reducePracticeEvent,
  type PracticeState,
  formatPitchName,
  type TargetNote,
  MusicalNote,
  isMatch,
  type NoteName,
} from './practice-core'

const n = (s: string) => s as NoteName
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
    const initialState: PracticeState = {
      ...getInitialState('listening'),
      detectionHistory: [
        {
          pitch: 'A4',
          cents: 5,
          timestamp: Date.now(),
          confidence: 0.9,
        },
      ],
    }
    const event = { type: 'NO_NOTE_DETECTED' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.detectionHistory).toEqual([])
  })

  it('should advance to the next note on NOTE_MATCHED when listening', () => {
    const initialState = getInitialState('listening', 0)
    const event = { type: 'NOTE_MATCHED' as const }
    const newState = reducePracticeEvent(initialState, event)
    expect(newState.currentIndex).toBe(1)
    expect(newState.status).toBe('correct')
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
    const initialState: PracticeState = {
      ...getInitialState('listening', 0),
      detectionHistory: [
        {
          pitch: 'G4',
          cents: 2,
          timestamp: Date.now(),
          confidence: 0.95,
        },
      ],
    }
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
    const pitchFlat = { step: 'D', octave: 4, alter: 'flat' } as unknown as TargetNote['pitch']
    expect(formatPitchName(pitchFlat)).toBe('Db4')

    const pitchSharp = { step: 'F', octave: 4, alter: 'sharp' } as unknown as TargetNote['pitch']
    expect(formatPitchName(pitchSharp)).toBe('F#4')

    const pitchNatural = { step: 'G', octave: 4, alter: 'natural' } as unknown as TargetNote['pitch']
    expect(formatPitchName(pitchNatural)).toBe('G4')
  })

  it('should handle double sharp/flat values', () => {
    const pitch1 = { step: 'E', octave: 4, alter: '##' } as unknown as TargetNote['pitch']
    const pitch2 = { step: 'F', octave: 4, alter: -2 } as unknown as TargetNote['pitch']
    // Canonicalization to -1 | 0 | 1 simplifies double accidentals for standard tuning logic
    expect(formatPitchName(pitch1)).toBe('E#4')
    expect(formatPitchName(pitch2)).toBe('Fb4')
  })

  it('should handle no alter value', () => {
    const pitch: TargetNote['pitch'] = { step: 'G', octave: 4, alter: 0 }
    expect(formatPitchName(pitch)).toBe('G4')
  })

  it('should throw an error for unsupported alter values', () => {
    const pitch = { step: 'A', octave: 4, alter: 3 } as unknown as TargetNote['pitch']
    expect(() => formatPitchName(pitch)).toThrow(/Unsupported alter value: 3/)
  })
})

describe('MusicalNote Enharmonic Equivalents', () => {
  it('should treat C#4 and Db4 as equivalent', () => {
    const cSharp = MusicalNote.fromName(n('C#4'))
    const dFlat = MusicalNote.fromName(n('Db4'))
    expect(cSharp.isEnharmonic(dFlat)).toBe(true)
    expect(cSharp.midiNumber).toBe(dFlat.midiNumber)
  })

  it('should handle Cb4 as equivalent to B3', () => {
    const cFlat = MusicalNote.fromName(n('Cb4'))
    const bNatural = MusicalNote.fromName(n('B3'))
    expect(cFlat.isEnharmonic(bNatural)).toBe(true)
    expect(cFlat.midiNumber).toBe(bNatural.midiNumber)
  })

  it('should handle B#3 as equivalent to C4', () => {
    const bSharp = MusicalNote.fromName(n('B#3'))
    const cNatural = MusicalNote.fromName(n('C4'))
    expect(bSharp.isEnharmonic(cNatural)).toBe(true)
    expect(bSharp.midiNumber).toBe(cNatural.midiNumber)
  })

  it('should handle E#4 as equivalent to F4', () => {
    const eSharp = MusicalNote.fromName(n('E#4'))
    const fNatural = MusicalNote.fromName(n('F4'))
    expect(eSharp.isEnharmonic(fNatural)).toBe(true)
    expect(eSharp.midiNumber).toBe(fNatural.midiNumber)
  })

  it('should handle Fb4 as equivalent to E4', () => {
    const fFlat = MusicalNote.fromName(n('Fb4'))
    const eNatural = MusicalNote.fromName(n('E4'))
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

  it('should handle sharps correctly', () => {
    const note = MusicalNote.fromName(n('C#4'))
    expect(note.midiNumber).toBe(61)
    expect(note.noteName).toBe('C#')
  })

  it('should handle flats correctly', () => {
    const note = MusicalNote.fromName(n('Bb3'))
    expect(note.midiNumber).toBe(58)
    expect(note.noteName).toBe('A#') // MusicalNote currently returns sharp names
  })

  it('should handle double sharps', () => {
    const note = MusicalNote.fromName(n('F##4'))
    expect(note.midiNumber).toBe(67) // F#4=66, F##4=67 (G4)
  })

  it('should handle double flats', () => {
    const note = MusicalNote.fromName(n('Ebb4'))
    expect(note.midiNumber).toBe(62) // E4=64, Eb4=63, Ebb4=62 (D4)
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
    // Missing octave
    expect(() => MusicalNote.fromName(n('C#'))).toThrow('Invalid note name format: "C#"')
    // Invalid step
    expect(() => MusicalNote.fromName(n('H4'))).toThrow('Invalid note name format: "H4"')
    // Misplaced accidental
    expect(() => MusicalNote.fromName(n('C4#'))).toThrow('Invalid note name format: "C4#"')
    // Empty string
    expect(() => MusicalNote.fromName(n(''))).toThrow('Invalid note name format: ""')
  })
})

describe('isMatch', () => {
  const target: TargetNote = {
    pitch: { step: 'A', octave: 4, alter: 0 },
    duration: 4,
  }

  it('should return true for a correct match', () => {
    const detected = { pitch: 'A4', cents: 0, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detected)).toBe(true)
  })

  it('should return true for an enharmonic match', () => {
    const enharmonicTarget: TargetNote = {
      pitch: { step: 'C', octave: 4, alter: 1 }, // C#4
      duration: 4,
    }
    const detected = { pitch: 'Db4', cents: 0, timestamp: 0, confidence: 1 }
    expect(isMatch(enharmonicTarget, detected)).toBe(true)
  })

  it('should handle numeric alter values in the target', () => {
    const sharpTarget: TargetNote = {
      pitch: { step: 'G', octave: 3, alter: 1 }, // G#3
      duration: 4,
    }
    const flatTarget: TargetNote = {
      pitch: { step: 'B', octave: 4, alter: -1 }, // Bb4
      duration: 4,
    }
    const detectedSharp = { pitch: 'G#3', cents: 0, timestamp: 0, confidence: 1 }
    const detectedFlat = { pitch: 'A#4', cents: 0, timestamp: 0, confidence: 1 } // Enharmonic equivalent

    expect(isMatch(sharpTarget, detectedSharp)).toBe(true)
    expect(isMatch(flatTarget, detectedFlat)).toBe(true)
  })

  it('should return false if cents are out of tolerance', () => {
    const detected = { pitch: 'A4', cents: 30, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detected, 25)).toBe(false)
  })

  it('should return true if cents are exactly at the tolerance boundary (exclusive)', () => {
    const detectedPositive = { pitch: 'A4', cents: 24.99, timestamp: 0, confidence: 1 }
    const detectedNegative = { pitch: 'A4', cents: -24.99, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detectedPositive, 25)).toBe(true)
    expect(isMatch(target, detectedNegative, 25)).toBe(true)
  })

  it('should return false if cents are exactly at the tolerance boundary (inclusive)', () => {
    const detectedPositive = { pitch: 'A4', cents: 25, timestamp: 0, confidence: 1 }
    const detectedNegative = { pitch: 'A4', cents: -25, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detectedPositive, 25)).toBe(false)
    expect(isMatch(target, detectedNegative, 25)).toBe(false)
  })

  it('should implement hysteresis correctly', () => {
    const hysteresis = { enter: 20, exit: 30 }
    const detectedAt25 = { pitch: 'A4', cents: 25, timestamp: 0, confidence: 1 }

    // Case 1: Not previously matched, 25 cents is outside "enter" (20)
    expect(isMatch(target, detectedAt25, hysteresis, false)).toBe(false)

    // Case 2: Previously matched, 25 cents is inside "exit" (30)
    expect(isMatch(target, detectedAt25, hysteresis, true)).toBe(true)

    // Case 3: Transition out of match (35 cents is outside exit 30)
    const detectedAt35 = { pitch: 'A4', cents: 35, timestamp: 0, confidence: 1 }
    expect(isMatch(target, detectedAt35, hysteresis, true)).toBe(false)
  })

  it('should rethrow parsing errors for invalid target notes', () => {
    const invalidTarget = {
      pitch: { step: 'C', octave: 4, alter: 7 },
      duration: 4,
    } as unknown as TargetNote
    const detected = { pitch: 'A4', cents: 0, timestamp: 0, confidence: 1 }
    expect(() => isMatch(invalidTarget, detected)).toThrow(/Unsupported alter value: 7/)
  })
})
