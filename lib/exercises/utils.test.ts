import { describe, it, expect } from 'vitest'
import { parsePitch, getDurationMs } from './utils'

describe('Exercise Utilities', () => {
  describe('parsePitch', () => {
    it('should parse simple notes correctly', () => {
      expect(parsePitch('C4')).toEqual({ step: 'C', alter: 0, octave: 4 })
      expect(parsePitch('A4')).toEqual({ step: 'A', alter: 0, octave: 4 })
      expect(parsePitch('G3')).toEqual({ step: 'G', alter: 0, octave: 3 })
    })

    it('should parse sharp and flat notes correctly', () => {
      expect(parsePitch('G#4')).toEqual({ step: 'G', alter: 1, octave: 4 })
      expect(parsePitch('Bb3')).toEqual({ step: 'B', alter: -1, octave: 3 })
    })

    it('should throw error for invalid pitch formats', () => {
      expect(() => parsePitch('H4')).toThrow(/Invalid pitch format/)
      expect(() => parsePitch('C')).toThrow(/Invalid pitch format/)
      expect(() => parsePitch('C#')).toThrow(/Invalid pitch format/)
      expect(() => parsePitch('4C')).toThrow(/Invalid pitch format/)
    })
  })

  describe('getDurationMs', () => {
    it('should calculate duration correctly at 60 BPM', () => {
      expect(getDurationMs(4, 60)).toBe(1000) // Quarter note
      expect(getDurationMs(2, 60)).toBe(2000) // Half note
      expect(getDurationMs(1, 60)).toBe(4000) // Whole note
      expect(getDurationMs(8, 60)).toBe(500) // Eighth note
    })

    it('should calculate duration correctly at 120 BPM', () => {
      expect(getDurationMs(4, 120)).toBe(500)
      expect(getDurationMs(2, 120)).toBe(1000)
      expect(getDurationMs(8, 120)).toBe(250)
    })

    it('should use default 60 BPM if not provided', () => {
      expect(getDurationMs(4)).toBe(1000)
    })
  })
})
