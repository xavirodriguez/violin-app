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
    const defaultDetector = new PitchDetector(sampleRate, 1400)
    // 100 Hz is below MIN_FREQUENCY (180)
    const lowBuffer = createSineWave(100, 0.1)
    expect(defaultDetector.detectPitch(lowBuffer).pitchHz).toBe(0)

    // 1500 Hz is above provided maxFrequency (1400)
    // Note: If the fundamental is out of range, the detector may find a
    // sub-harmonic that is within the searched range (e.g., 750 Hz).
    // This is a known property of limited-range YIN.
    const highBuffer = createSineWave(1500, 0.1)
    const result = defaultDetector.detectPitch(highBuffer)

    // We accept 0 or a sub-harmonic, but definitely NOT 1500
    if (result.pitchHz > 0) {
      expect(result.pitchHz).toBeLessThanOrEqual(1400)
      expect(result.pitchHz).toBeCloseTo(750, 0)
    } else {
      expect(result.pitchHz).toBe(0)
    }
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

  it('should normalize buffers correctly', () => {
    const buffer = new Float32Array([0.1, -0.2, 0.5, -0.4])
    const normalized = detector.normalize(buffer)

    expect(normalized[2]).toBeCloseTo(1.0, 5)
    expect(normalized[1]).toBeCloseTo(-0.4, 5)
    expect(normalized.length).toBe(buffer.length)
  })

  it('should detect pitch in very quiet signals when adaptive is enabled', () => {
    // Very quiet signal (RMS < 0.01)
    const quietAmplitude = 0.0001
    const buffer = createSineWave(440, 0.1, quietAmplitude)
    const rms = detector.calculateRMS(buffer)
    expect(rms).toBeLessThan(0.01)

    // Without adaptive, should be 0
    const resultNormal = detector.detectPitchWithValidation(buffer, 0.01, false)
    expect(resultNormal.pitchHz).toBe(0)

    // With adaptive, should detect 440 Hz
    const resultAdaptive = detector.detectPitchWithValidation(buffer, 0.01, true)
    expect(resultAdaptive.pitchHz).toBeCloseTo(440, 1)
    expect(resultAdaptive.confidence).toBeGreaterThan(0.9)
  })

  it('should detect the fundamental even with strong high-frequency harmonics', () => {
    // Fundamental A4 (440 Hz)
    const freq1 = 440
    // Strong harmonic at ~5280 Hz (12th harmonic)
    // This harmonic is outside the MAX_FREQUENCY (3000 Hz)
    const freq2 = 5280
    const durationSec = 0.1
    const size = Math.floor(sampleRate * durationSec)
    const buffer = new Float32Array(size)

    for (let i = 0; i < size; i++) {
      const t = i / sampleRate
      // Harmonic is strong but realistic (fundamental is dominant)
      buffer[i] = 0.7 * Math.sin(2 * Math.PI * freq1 * t) + 0.3 * Math.sin(2 * Math.PI * freq2 * t)
    }

    const result = detector.detectPitch(buffer)

    // Should detect the fundamental and ignore the harmonic because it's outside search range
    expect(result.pitchHz).toBeCloseTo(440, 0)
    expect(result.confidence).toBeGreaterThan(0.8)
  })
})
