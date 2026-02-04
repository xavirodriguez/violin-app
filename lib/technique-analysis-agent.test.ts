import { describe, it, expect } from 'vitest'
import { TechniqueAnalysisAgent } from './technique-analysis-agent'
import {
  TechniqueFrame,
  NoteSegment,
  TimestampMs,
  Hz,
  Cents,
  MusicalNoteName,
} from './technique-types'

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
        kind: 'pitched',
        timestamp: t as TimestampMs,
        pitchHz: 440 as Hz,
        cents: centsFunc(t) as Cents,
        rms: rmsFunc(t),
        confidence: 0.9,
        noteName: 'A4' as MusicalNoteName,
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
      segmentId: 'test-1',
      durationMs: 500 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 500 as TimestampMs,
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
      segmentId: 'test-2',
      durationMs: 1000 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 1000 as TimestampMs,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)

    expect(metrics.vibrato.present).toBe(true)
    expect(metrics.vibrato.rateHz).toBeCloseTo(rate, 0)
    expect(metrics.vibrato.widthCents).toBeCloseTo(width, 0)
  })

  it('should gate vibrato if pitch stability is low', () => {
    // Add chaos to the pitch signal (stdDev > 40)
    const frames = createFrames(
      1000,
      (t) => (t % 100 < 50 ? 50 : -50),
      () => 0.1,
    )
    const segment: NoteSegment = {
      segmentId: 'test-3',
      durationMs: 1000 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 1000 as TimestampMs,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)
    expect(metrics.vibrato.present).toBe(false)
  })

  it('should detect resonance/wolf-tone evidence', () => {
    const frames = createFrames(
      500,
      () => 0,
      () => 0.05,
    ).map((f) => ({ ...f, confidence: 0.4 }))
    const segment: NoteSegment = {
      segmentId: 'test-4',
      durationMs: 500 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 500 as TimestampMs,
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
      segmentId: 'test-5',
      durationMs: 500 as TimestampMs,
      noteIndex: 1,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 1050 as TimestampMs,
      endTime: 1550 as TimestampMs,
      expectedStartTime: 1000 as TimestampMs,
      expectedDuration: 500 as TimestampMs,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)
    expect(metrics.rhythm.onsetErrorMs).toBe(50)
  })

  it('should calculate attack and release metrics correctly', () => {
    // Simulated attack: RMS grows from 0 to 0.1 over 100ms
    const frames = createFrames(
      500,
      (t) => (t < 100 ? -10 : 0), // scoop
      (t) => Math.min(0.1, (t / 100) * 0.1),
    )
    const segment: NoteSegment = {
      segmentId: 'test-6',
      durationMs: 500 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 500 as TimestampMs,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)

    expect(metrics.attackRelease.attackTimeMs).toBeGreaterThan(50)
    expect(metrics.attackRelease.attackTimeMs).toBeLessThan(150)
    expect(metrics.attackRelease.pitchScoopCents).toBeLessThan(-5)

    // Unstable release: add some noise at the end
    const lastFrames = (segment.frames as any).slice(-5)
    lastFrames.forEach((f: any, i: number) => {
      f.cents += Math.sin(i) * 20
    })

    const metricsWithRelease = agent.analyzeSegment(segment)
    expect(metricsWithRelease.attackRelease.releaseStability).toBeGreaterThan(5)
  })

  it('should calculate transition metrics correctly', () => {
    const gapFrames = createFrames(
      150,
      (t) => (t / 150) * 100, // glissando of 100 cents
      () => 0.05,
    )
    const currentFrames = createFrames(
      500,
      (t) => (t < 200 ? 15 : 0), // landing with 15 cents error
      () => 0.1,
    )

    const segment: NoteSegment = {
      segmentId: 'test-7',
      durationMs: 500 as TimestampMs,
      noteIndex: 1,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 150 as TimestampMs,
      endTime: 650 as TimestampMs,
      frames: currentFrames,
    }

    const metrics = agent.analyzeSegment(segment, gapFrames)

    expect(metrics.transition.transitionTimeMs).toBeGreaterThan(100)
    expect(metrics.transition.glissAmountCents).toBeGreaterThan(50)
    expect(metrics.transition.landingErrorCents).toBeGreaterThan(5)
  })

  it('should calculate settling stability and drift correctly', () => {
    // Linear drift of 20 cents per second
    const frames = createFrames(
      1000,
      (t) => (t / 1000) * 20,
      () => 0.1,
    )
    const segment: NoteSegment = {
      segmentId: 'test-8',
      durationMs: 1000 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 1000 as TimestampMs,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)
    expect(metrics.pitchStability.driftCentsPerSec).toBeCloseTo(20, 1)

    // Unstable attack (first 100ms) but stable thereafter
    // Default settlingTimeMs is 150ms
    const unstableFrames = createFrames(
      500,
      (t) => (t < 100 ? (t % 10 === 0 ? 20 : -20) : 0),
      () => 0.1,
    )
    const unstableSegment: NoteSegment = {
      segmentId: 'test-9',
      durationMs: 500 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 500 as TimestampMs,
      frames: unstableFrames,
    }
    const unstableMetrics = agent.analyzeSegment(unstableSegment)
    expect(unstableMetrics.pitchStability.globalStdCents).toBeGreaterThan(5)
    expect(unstableMetrics.pitchStability.settlingStdCents).toBeCloseTo(0)
  })

  it('should generate prioritized observations', () => {
    // Create a segment with multiple issues:
    // 1. Critical Wolf tone (severity 3, confidence 0.6 -> score 1.8)
    // 2. Inconsistent vibrato (severity 2, confidence 0.7 -> score 1.4)

    const frames = createFrames(
      1000,
      () => 0,
      () => 0.1,
    ).map((f) => ({
      ...f,
      confidence: 0.3, // Low confidence contributes to suspectedWolf
    }))
    const segment: NoteSegment = {
      segmentId: 'test-10',
      durationMs: 1000 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 1000 as TimestampMs,
      frames,
    }

    // Add some RMS beating (8Hz) for wolf tone detection
    frames.forEach((f: any) => {
      f.rms = 0.05 + 0.04 * Math.sin(2 * Math.PI * 8 * (f.timestamp / 1000))
    })

    // Add some pitch noise to trigger inconsistent vibrato
    frames.forEach((f: any, i: number) => {
      // Random-ish noise to ensure low regularity
      f.cents += Math.sin(i * 0.5) * 15 + Math.cos(i * 2) * 10
    })

    const metrics = agent.analyzeSegment(segment)
    const observations = agent.generateObservations(metrics)

    expect(observations.length).toBeGreaterThan(1)
    // Highest score first: Resonance (1.8) > Vibrato (1.4)
    expect(observations[0].type).toBe('resonance')
    expect(observations[0].severity).toBe(3)
    expect(observations.some((o) => o.type === 'vibrato')).toBe(true)
  })

  it('should filter observations by confidence threshold', () => {
    // Generate many low-severity/low-confidence observations and check they are capped at 3
    const frames = createFrames(
      500,
      (t) => 20 * Math.sin(t),
      () => 0.1,
    )
    const segment: NoteSegment = {
      segmentId: 'test-11',
      durationMs: 500 as TimestampMs,
      noteIndex: 0,
      targetPitch: 'A4' as MusicalNoteName,
      startTime: 0 as TimestampMs,
      endTime: 500 as TimestampMs,
      frames,
    }
    const metrics = agent.analyzeSegment(segment)
    const observations = agent.generateObservations(metrics)
    expect(observations.length).toBeLessThanOrEqual(3)
  })
})
