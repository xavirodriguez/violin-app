import { describe, it, expect } from 'vitest'
import { TechniqueAnalysisAgent } from '@/lib/technique-analysis-agent'
import {
  TechniqueFrame,
  NoteSegment,
  TimestampMs,
  Hz,
  Cents,
  MusicalNoteName,
} from '@/lib/technique-types'

describe('TechniqueAnalysisAgent - Wolf Tone Configuration (TASK-11)', () => {
  const createFrames = (
    durationMs: number,
    centsFunc: (t: number) => number,
    rmsFunc: (t: number) => number,
    confidenceFunc: (t: number) => number = () => 0.9,
  ): TechniqueFrame[] => {
    const frames: TechniqueFrame[] = []
    for (let t = 0; t <= durationMs; t += 5) {
      frames.push({
        kind: 'pitched',
        timestamp: t as TimestampMs,
        pitchHz: 440 as Hz,
        cents: centsFunc(t) as Cents,
        rms: rmsFunc(t),
        confidence: confidenceFunc(t),
        noteName: 'A4' as MusicalNoteName,
      })
    }
    return frames
  }

  const createSegment = (frames: TechniqueFrame[]): NoteSegment => ({
    segmentId: 'test-wolf',
    durationMs: (frames[frames.length - 1].timestamp - frames[0].timestamp) as TimestampMs,
    noteIndex: 0,
    targetPitch: 'A4' as MusicalNoteName,
    startTime: frames[0].timestamp,
    endTime: frames[frames.length - 1].timestamp,
    frames,
  })

  it('should use default thresholds to detect wolf tone', () => {
    const agent = new TechniqueAnalysisAgent()
    // Low confidence ratio = 1.0 (threshold 0.3)
    // High RMS beating = ~0.7 (threshold 0.4)
    const frames = createFrames(
      500,
      () => 0,
      (t) => 0.05 + 0.04 * Math.sin(2 * Math.PI * 8 * (t / 1000)),
      () => 0.4,
    )
    const metrics = agent.analyzeSegment({ segment: createSegment(frames) })
    expect(metrics.resonance.suspectedWolf).toBe(true)
  })

  it('should not detect wolf tone if thresholds are increased', () => {
    const agent = new TechniqueAnalysisAgent({
      wolfLowConfRatioThreshold: 1.1, // Impossible to reach
    })
    const frames = createFrames(
      500,
      () => 0,
      (t) => 0.05 + 0.04 * Math.sin(2 * Math.PI * 8 * (t / 1000)),
      () => 0.4,
    )
    const metrics = agent.analyzeSegment({ segment: createSegment(frames) })
    expect(metrics.resonance.suspectedWolf).toBe(false)
  })

  it('should not detect wolf tone if RMS beating threshold is increased', () => {
    const agent = new TechniqueAnalysisAgent({
      wolfRmsBeatingThreshold: 1.1, // Above max possible correlation of 1.0
    })
    // High RMS beating = ~1.0 (threshold 1.1)
    // Low confidence ratio = 1.0 (threshold 0.3)
    const frames = createFrames(
      500,
      () => 0,
      (t) => 0.05 + 0.04 * Math.sin(2 * Math.PI * 8 * (t / 1000)),
      () => 0.4,
    )
    const metrics = agent.analyzeSegment({ segment: createSegment(frames) })
    expect(metrics.resonance.suspectedWolf).toBe(false)
  })

  it('should detect wolf tone via chaos instability with custom threshold', () => {
    const agent = new TechniqueAnalysisAgent({
      wolfRmsBeatingThreshold: 0.2,
      wolfChaosMultiplier: 1.0
    })
    // RMS beating ~0.4 (threshold 0.2 * 1.0 = 0.2)
    // Pitch chaos > 20
    const frames = createFrames(
      500,
      (t) => (t % 20 < 10 ? 30 : -30),
      (t) => 0.05 + 0.02 * Math.sin(2 * Math.PI * 8 * (t / 1000)),
      () => 0.9, // High confidence to avoid isConfInstability
    )
    const metrics = agent.analyzeSegment({ segment: createSegment(frames) })
    expect(metrics.resonance.suspectedWolf).toBe(true)
  })
})
