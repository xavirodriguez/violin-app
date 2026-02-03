// Added for type safety verification
import { describe, it, expect } from 'vitest'
import { assertValidNoteName, MusicalNote, formatPitchName } from '@/lib/practice-core'
import { AppError } from '@/lib/errors/app-error'

describe('Branded Types Validation', () => {
  it('should validate correct note names', () => {
    // Should not throw
    expect(() => assertValidNoteName('C4')).not.toThrow()
    expect(() => assertValidNoteName('F#5')).not.toThrow()
    expect(() => assertValidNoteName('Bb3')).not.toThrow()
    expect(() => assertValidNoteName('G##4')).not.toThrow()
    expect(() => assertValidNoteName('Ebb2')).not.toThrow()
  })

  it('should throw AppError on invalid note names', () => {
    expect(() => assertValidNoteName('H9')).toThrow(AppError)
    expect(() => assertValidNoteName('H9')).toThrow(/Invalid note name format/)
    expect(() => assertValidNoteName('C')).toThrow(AppError)
    expect(() => assertValidNoteName('4C')).toThrow(AppError)
    expect(() => assertValidNoteName('')).toThrow(AppError)
  })

  it('formatPitchName should return a valid NoteName', () => {
    const pitch = { step: 'C', octave: 4, alter: 1 } as const
    const result = formatPitchName(pitch)
    expect(result).toBe('C#4')
    // This confirms MusicalNote.fromName accepts it without cast in real code
    expect(MusicalNote.fromName(result)).toBeDefined()
  })
})
