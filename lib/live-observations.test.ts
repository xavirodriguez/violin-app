import { describe, it, expect } from 'vitest'
import { calculateLiveObservations } from './live-observations'
import { DetectedNote } from './practice-core'

describe('calculateLiveObservations', () => {
  const mockDetection = (overrides: Partial<DetectedNote> = {}): DetectedNote => ({
    pitch: 'A4',
    pitchHz: 440,
    cents: 0,
    timestamp: Date.now(),
    confidence: 0.9,
    ...overrides,
  })

  it('should return empty array if less than 5 detections', () => {
    const detections = Array(4).fill(null).map(() => mockDetection())
    const result = calculateLiveObservations(detections, 'A4')
    expect(result).toEqual([])
  })

  it('should detect consistently sharp intonation', () => {
    const detections = Array(10).fill(null).map((_, i) => mockDetection({
      cents: 20,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(detections, 'A4')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].type).toBe('intonation')
    expect(result[0].message).toContain('sharp')
  })

  it('should detect consistently flat intonation', () => {
    const detections = Array(10).fill(null).map((_, i) => mockDetection({
      cents: -20,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(detections, 'A4')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].type).toBe('intonation')
    expect(result[0].message).toContain('flat')
  })

  it('should detect wavering pitch (unstable)', () => {
    const detections = Array(10).fill(null).map((_, i) => mockDetection({
      cents: i % 2 === 0 ? 20 : -20,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(detections, 'A4')
    expect(result.some(o => o.type === 'stability')).toBe(true)
    expect(result.find(o => o.type === 'stability')?.message).toContain('wavering')
  })

  it('should detect wrong note', () => {
    const detections = Array(10).fill(null).map((_, i) => mockDetection({
      pitch: 'G4',
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(detections, 'A4')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].severity).toBe(3)
    expect(result[0].message).toContain('G4')
    expect(result[0].message).toContain('instead of A4')
  })

  it('should detect weak tone (low confidence)', () => {
    const detections = Array(10).fill(null).map((_, i) => mockDetection({
      confidence: 0.5,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(detections, 'A4')
    expect(result.some(o => o.type === 'attack')).toBe(true)
    expect(result.find(o => o.type === 'attack')?.message).toContain('Weak')
  })

  it('should limit to maximum 2 observations', () => {
    const detections = Array(10).fill(null).map((_, i) => mockDetection({
      pitch: 'G4', // Wrong note (Severity 3)
      cents: 25,   // Sharp (Severity 2)
      confidence: 0.5, // Weak (Severity 1)
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(detections, 'A4')
    expect(result.length).toBeLessThanOrEqual(2)
    // Priority should be wrong note and then intonation or stability
    expect(result[0].severity).toBe(3)
  })
})
