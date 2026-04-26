import { describe, it, expect } from 'vitest'
import { createPitchDetectorForDifficulty, PitchDetector } from '@/lib/pitch-detector'

describe('PitchDetector Difficulty Factory', () => {
  const sampleRate = 44100

  it('should create a detector with 1320Hz max frequency for Beginner', () => {
    const detector = createPitchDetectorForDifficulty('Beginner', sampleRate)
    const range = detector.getFrequencyRange()
    expect(range.max).toBe(1320)
  })

  it('should create a detector with 1760Hz max frequency for Intermediate', () => {
    const detector = createPitchDetectorForDifficulty('Intermediate', sampleRate)
    const range = detector.getFrequencyRange()
    expect(range.max).toBe(1760)
  })

  it('should create a detector with 2637Hz max frequency for Advanced', () => {
    const detector = createPitchDetectorForDifficulty('Advanced', sampleRate)
    const range = detector.getFrequencyRange()
    expect(range.max).toBe(2637)
  })

  it('should allow overriding max frequency in constructor', () => {
    const detector = new PitchDetector(sampleRate, 1000)
    const range = detector.getFrequencyRange()
    expect(range.max).toBe(1000)
  })

  it('should use default max frequency if not provided in constructor', () => {
    const detector = new PitchDetector(sampleRate)
    const range = detector.getFrequencyRange()
    expect(range.max).toBe(1320)
  })
})
