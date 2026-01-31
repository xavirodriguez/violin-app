import { describe, it, expect } from 'vitest'
import { calculateLiveObservations } from '@/lib/live-observations'
import { DetectedNote } from '@/lib/practice-core'

const mockDetection = (overrides: Partial<DetectedNote> = {}): DetectedNote => ({
  pitch: 'A4',
  pitchHz: 440,
  cents: 0,
  confidence: 0.9,
  timestamp: Date.now(),
  ...overrides,
})

describe('calculateLiveObservations', () => {
  it('should return empty array if less than 5 detections', () => {
    const detections = Array(4).fill(mockDetection())
    const result = calculateLiveObservations(detections, 'A4')
    expect(result).toEqual([])
  })

  it('should detect consistently sharp intonation', () => {
    const sharpDetections = Array(10).fill(null).map((_, i) => mockDetection({
      pitch: 'A4',
      cents: 18 + i,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(sharpDetections, 'A4')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].type).toBe('intonation')
    expect(result[0].message).toContain('sharp')
  })

  it('should detect consistently flat intonation', () => {
    const flatDetections = Array(10).fill(null).map((_, i) => mockDetection({
      pitch: 'A4',
      cents: -18 - i,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(flatDetections, 'A4')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].type).toBe('intonation')
    expect(result[0].message).toContain('flat')
  })

  it('should detect pitch instability (wavering)', () => {
    const unstableDetections = Array(10).fill(null).map((_, i) => mockDetection({
      pitch: 'A4',
      cents: i % 2 === 0 ? 20 : -20,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(unstableDetections, 'A4')
    expect(result.some(o => o.type === 'stability')).toBe(true)
    expect(result.find(o => o.type === 'stability')?.message).toContain('wavering')
  })

  it('should detect wrong note', () => {
    const wrongNoteDetections = Array(10).fill(null).map((_, i) => mockDetection({
      pitch: 'G4',
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(wrongNoteDetections, 'A4')
    expect(result[0].severity).toBe(3)
    expect(result[0].message).toContain('G4')
  })

  it('should detect low confidence (weak tone)', () => {
    const lowConfDetections = Array(10).fill(null).map((_, i) => mockDetection({
      confidence: 0.5,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(lowConfDetections, 'A4')
    expect(result.some(o => o.type === 'attack')).toBe(true)
    expect(result.find(o => o.type === 'attack')?.message).toContain('Weak')
  })

  it('should limit to maximum 2 observations', () => {
    const complexDetections = Array(10).fill(null).map((_, i) => mockDetection({
      pitch: 'A4',
      cents: 25,
      confidence: 0.5,
      timestamp: Date.now() + i * 50
    }))
    const result = calculateLiveObservations(complexDetections, 'A4')
    expect(result.length).toBeLessThanOrEqual(2)
  })
})
