import { describe, it, expect } from 'vitest'
import { TechniqueAnalysisAgent } from './technique-analysis-agent'
import { TechniqueFrame, NoteSegment } from './technique-types'

describe('TechniqueAnalysisAgent', () => {
  const agent = new TechniqueAnalysisAgent()

  const createFrames = (
    durationMs: number,
    centsFunc: (t: number) => number,
    rmsFunc: (t: number) => number,
  ): TechniqueFrame[] => {
    const frames: TechniqueFrame[] = []
    for (let t = 0; t <= durationMs; t += 5) {
      frames.push({
        timestamp: t,
        pitchHz: 440,
        cents: centsFunc(t),
        rms: rmsFunc(t),
        confidence: 0.9,
        noteName: 'A4',
      })
    }
    return frames
  }

  it('should calculate base stability correctly', () => {
    const frames = createFrames(
      500,
      () => 10,
      () => 0.05,
    )
    const segment: NoteSegment = {
      noteIndex: 0,
      targetPitch: 'A4',
      startTime: 0,
      endTime: 500,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)
    expect(metrics.pitchStability.globalStdCents).toBeCloseTo(0)
    expect(metrics.pitchStability.inTuneRatio).toBe(1)
  })

  it('should detect vibrato rate and width', () => {
    const rate = 6
    const width = 20
    const frames = createFrames(
      1000,
      (t) => (width / 2) * Math.sin(2 * Math.PI * rate * (t / 1000)),
      () => 0.1,
    )

    const segment: NoteSegment = {
      noteIndex: 0,
      targetPitch: 'A4',
      startTime: 0,
      endTime: 1000,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)

    expect(metrics.vibrato.present).toBe(true)
    expect(metrics.vibrato.rateHz).toBeGreaterThan(5.5)
    expect(metrics.vibrato.rateHz).toBeLessThan(6.5)
  })

  it('should detect resonance/wolf-tone evidence', () => {
    const frames = createFrames(
      500,
      () => 0,
      () => 0.05,
    ).map((f) => ({ ...f, confidence: 0.4 }))
    const segment: NoteSegment = {
      noteIndex: 0,
      targetPitch: 'A4',
      startTime: 0,
      endTime: 500,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)
    expect(metrics.resonance.suspectedWolf).toBe(true)
  })

  it('should calculate rhythm metrics', () => {
    const frames = createFrames(
      500,
      () => 0,
      () => 0.1,
    )
    const segment: NoteSegment = {
      noteIndex: 1,
      targetPitch: 'A4',
      startTime: 1050,
      endTime: 1550,
      expectedStartTime: 1000,
      expectedDuration: 500,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)
    expect(metrics.rhythm.onsetErrorMs).toBe(50)
  })
})
