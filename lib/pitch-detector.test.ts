import { describe, it, expect } from 'vitest'
import { PitchDetector } from './pitch-detector'
import { AppError, ERROR_CODES } from './errors/app-error'

describe('PitchDetector', () => {
  const sampleRate = 44100
  const detector = new PitchDetector(sampleRate)

  const createSineWave = (freq: number, durationSec: number, amplitude = 0.5): Float32Array => {
    const size = Math.floor(sampleRate * durationSec)
    const buffer = new Float32Array(size)
    for (let i = 0; i < size; i++) {
      buffer[i] = amplitude * Math.sin(2 * Math.PI * freq * (i / sampleRate))
    }
    return buffer
  }

  it('should detect A4 (440 Hz) correctly', () => {
    const buffer = createSineWave(440, 0.1)
    const result = detector.detectPitch(buffer)
    expect(result.pitchHz).toBeCloseTo(440, 1)
    expect(result.confidence).toBeGreaterThan(0.9)
  })

  it('should respect frequency range constraints', () => {
    // 100 Hz is below MIN_FREQUENCY (180)
    const lowBuffer = createSineWave(100, 0.1)
    expect(detector.detectPitch(lowBuffer).pitchHz).toBe(0)

    // 1000 Hz is above default MAX_FREQUENCY (700)
    const highBuffer = createSineWave(1000, 0.1)
    expect(detector.detectPitch(highBuffer).pitchHz).toBe(0)
  })

  it('should calculate RMS correctly', () => {
    const silence = new Float32Array(100)
    expect(detector.calculateRMS(silence)).toBe(0)

    // Sine wave RMS is Amplitude / sqrt(2)
    const amplitude = 0.5
    const buffer = createSineWave(440, 0.1, amplitude)
    expect(detector.calculateRMS(buffer)).toBeCloseTo(amplitude / Math.sqrt(2), 2)
  })

  it('should validate setMaxFrequency', () => {
    expect(() => detector.setMaxFrequency(2000)).not.toThrow()
    expect(detector.getFrequencyRange().max).toBe(2000)

    // Should reject values <= MIN_FREQUENCY (180)
    try {
      detector.setMaxFrequency(100)
      expect.fail('Should have thrown AppError')
    } catch (e) {
      if (e instanceof AppError) {
        expect(e.code).toBe(ERROR_CODES.DATA_VALIDATION_ERROR)
      } else {
        throw e
      }
    }

    // Should reject values > 20000
    expect(() => detector.setMaxFrequency(25000)).toThrow(AppError)
  })
})
