import { describe, it, expect } from 'vitest'
import { clamp } from '@/lib/ui-utils'
import { PitchDetector } from '@/lib/pitch-detector'
import { ERROR_CODES } from '@/lib/errors/app-error'

describe('Range Validation', () => {
  describe('clamp', () => {
    it('should throw if min > max', () => {
      try {
        clamp(5, 10, 0)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.code).toBe(ERROR_CODES.DATA_VALIDATION_ERROR)
      }
    })

    it('should work for valid ranges', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('PitchDetector.setMaxFrequency', () => {
    it('should throw for invalid max frequency', () => {
      const detector = new PitchDetector(44100)

      try {
        detector.setMaxFrequency(-100)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.code).toBe(ERROR_CODES.DATA_VALIDATION_ERROR)
      }

      try {
        detector.setMaxFrequency(25000)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.code).toBe(ERROR_CODES.DATA_VALIDATION_ERROR)
      }
    })

    it('should allow valid E7 for violin', () => {
      const detector = new PitchDetector(44100)
      expect(() => detector.setMaxFrequency(2637)).not.toThrow()
    })
  })
})
