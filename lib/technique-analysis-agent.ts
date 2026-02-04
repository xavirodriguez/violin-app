import {
  TechniqueFrame,
  PitchedFrame,
  NoteSegment,
  NoteTechnique,
  VibratoMetrics,
  PitchStability,
  AttackReleaseMetrics,
  ResonanceMetrics,
  RhythmMetrics,
  TransitionMetrics,
  Observation,
  AnalysisOptions,
  Cents,
  Hz,
  Ratio01,
  TimestampMs,
} from './technique-types'

const DEFAULT_OPTIONS: Required<AnalysisOptions> = {
  settlingTimeMs: 150 as TimestampMs,
  inTuneThresholdCents: 15 as Cents,
  vibratoMinRateHz: 4 as Hz,
  vibratoMaxRateHz: 10 as Hz,
  vibratoMinWidthCents: 10 as Cents,
  vibratoMinRegularity: 0.5 as Ratio01,
}

/**
 * A stateful agent that analyzes note segments to provide detailed technical feedback.
 */
export class TechniqueAnalysisAgent {
  private options: Required<AnalysisOptions>

  constructor(options: AnalysisOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Analyzes a `NoteSegment` and computes a comprehensive set of technique metrics.
   */
  analyzeSegment(
    segment: NoteSegment,
    gapFrames: ReadonlyArray<TechniqueFrame> = [],
    prevSegment: NoteSegment | null = null,
  ): NoteTechnique {
    const frames = segment.frames
    const pitchedFrames = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')

    return {
      vibrato: this.calculateVibrato(pitchedFrames),
      pitchStability: this.calculateStability(pitchedFrames),
      attackRelease: this.calculateAttackRelease(frames), // Attack/Release might use RMS from unpitched
      resonance: this.calculateResonance(pitchedFrames),
      rhythm: this.calculateRhythm(segment),
      transition: this.calculateTransition(gapFrames, frames, prevSegment),
    }
  }

  private calculateStability(frames: PitchedFrame[]): PitchStability {
    if (frames.length === 0) {
      return {
        settlingStdCents: 0 as Cents,
        globalStdCents: 0 as Cents,
        driftCentsPerSec: 0,
        inTuneRatio: 0 as Ratio01,
      }
    }

    const cents = frames.map((f) => f.cents)
    const globalStd = this.calculateStdDev(cents) as Cents

    // Settling stability: use frames after configured settling time
    const startTime = frames[0].timestamp
    const settlingFrames = frames.filter(
      (f) => f.timestamp - startTime > this.options.settlingTimeMs,
    )
    const settlingCents = settlingFrames.length > 0 ? settlingFrames.map((f) => f.cents) : cents
    const settlingStd = this.calculateStdDev(settlingCents) as Cents

    const drift = this.calculateDrift(frames)
    const inTuneRatio = (frames.filter((f) => Math.abs(f.cents) < this.options.inTuneThresholdCents)
      .length / frames.length) as Ratio01

    return {
      settlingStdCents: settlingStd,
      globalStdCents: globalStd,
      driftCentsPerSec: drift,
      inTuneRatio,
    }
  }

  private calculateVibrato(frames: PitchedFrame[]): VibratoMetrics {
    if (frames.length < 20) {
      return { present: false }
    }

    const duration = frames[frames.length - 1].timestamp - frames[0].timestamp
    if (duration < 500) {
      return { present: false }
    }

    const pitchStd = this.calculateStdDev(frames.map((f) => f.cents))
    if (pitchStd > 40) {
      return { present: false }
    }

    const detrended = this.detrend(frames)
    const std = this.calculateStdDev(detrended)
    const widthCents = (std * 2.828) as Cents

    const { periodMs, correlation } = this.findPeriod(
      detrended,
      frames.map((f) => f.timestamp),
    )
    const rateHz = (periodMs > 0 ? 1000 / periodMs : 0) as Hz
    const regularity = Math.max(0, correlation) as Ratio01

    const present =
      rateHz >= this.options.vibratoMinRateHz &&
      rateHz <= this.options.vibratoMaxRateHz &&
      widthCents >= this.options.vibratoMinWidthCents &&
      regularity >= this.options.vibratoMinRegularity

    return {
      present,
      rateHz: present ? rateHz : undefined,
      widthCents: present ? widthCents : undefined,
      regularity: present ? regularity : undefined,
    }
  }

  private calculateAttackRelease(frames: ReadonlyArray<TechniqueFrame>): AttackReleaseMetrics {
    if (frames.length === 0) {
      return {
        attackTimeMs: 0 as TimestampMs,
        pitchScoopCents: 0 as Cents,
        releaseStability: 0 as Cents,
      }
    }

    const startTime = frames[0].timestamp
    const rmsValues = frames.map((f) => f.rms)
    const maxRms = Math.max(...rmsValues)

    const middleFrames = frames.slice(
      Math.floor(frames.length * 0.25),
      Math.floor(frames.length * 0.75),
    )
    const stableRms =
      middleFrames.length > 0
        ? middleFrames.reduce((sum, f) => sum + f.rms, 0) / middleFrames.length
        : maxRms

    const stableRmsThreshold = stableRms * 0.85

    let attackTimeMs = 0 as TimestampMs
    const stableFrame = frames.find((f) => f.rms >= stableRmsThreshold)
    if (stableFrame) {
      attackTimeMs = (stableFrame.timestamp - startTime) as TimestampMs
    }

    const pitchedFrames = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    const earlyPitched = pitchedFrames.filter((f) => f.timestamp - startTime <= 150)
    const stablePitched = pitchedFrames.filter(
      (f) => f.timestamp - startTime > this.options.settlingTimeMs,
    )

    let pitchScoopCents = 0 as Cents
    if (earlyPitched.length > 0 && stablePitched.length > 0) {
      const avgEarly = earlyPitched.reduce((sum, f) => sum + f.cents, 0) / earlyPitched.length
      const avgStable = stablePitched.reduce((sum, f) => sum + f.cents, 0) / stablePitched.length
      pitchScoopCents = (avgEarly - avgStable) as Cents
    }

    const endTime = frames[frames.length - 1].timestamp
    const latePitched = pitchedFrames.filter((f) => endTime - f.timestamp <= 100)
    const releaseStability =
      latePitched.length > 0
        ? (this.calculateStdDev(latePitched.map((f) => f.cents)) as Cents)
        : (0 as Cents)

    return {
      attackTimeMs,
      pitchScoopCents,
      releaseStability,
    }
  }

  private calculateResonance(frames: PitchedFrame[]): ResonanceMetrics {
    if (frames.length < 10) {
      return { suspectedWolf: false, rmsBeatingScore: 0 as Ratio01, pitchChaosScore: 0, lowConfRatio: 0 as Ratio01 }
    }

    const highRmsFrames = frames.filter((f) => f.rms > 0.02)
    const lowConfRatio = (highRmsFrames.length > 0
      ? highRmsFrames.filter((f) => f.confidence < 0.6).length / highRmsFrames.length
      : 0) as Ratio01

    const rmsValues = frames.map((f) => f.rms)
    const meanRms = rmsValues.reduce((a, b) => a + b) / rmsValues.length
    const detrendedRms = rmsValues.map((v) => v - meanRms)
    const { correlation: rmsBeatingScore } = this.findPeriod(
      detrendedRms,
      frames.map((f) => f.timestamp),
    )

    const detrendedCents = this.detrend(frames)
    const pitchChaosScore = this.calculateStdDev(detrendedCents)

    const suspectedWolf =
      (lowConfRatio > 0.3 && rmsBeatingScore > 0.4) ||
      (rmsBeatingScore > 0.6 && pitchChaosScore > 20)

    return {
      suspectedWolf,
      rmsBeatingScore: Math.max(0, rmsBeatingScore) as Ratio01,
      pitchChaosScore,
      lowConfRatio,
    }
  }

  private calculateRhythm(segment: NoteSegment): RhythmMetrics {
    const onsetErrorMs =
      segment.expectedStartTime !== undefined ? segment.startTime - segment.expectedStartTime : 0

    const durationErrorMs =
      segment.expectedDuration !== undefined
        ? segment.endTime - segment.startTime - segment.expectedDuration
        : undefined

    return {
      onsetErrorMs,
      durationErrorMs,
    }
  }

  private calculateTransition(
    gapFrames: ReadonlyArray<TechniqueFrame>,
    currentFrames: ReadonlyArray<TechniqueFrame>,
    _prevSegment: NoteSegment | null,
  ): TransitionMetrics {
    const transitionTimeMs = (gapFrames.length > 1
      ? gapFrames[gapFrames.length - 1].timestamp - gapFrames[0].timestamp
      : 0) as TimestampMs

    const pitchedGap = gapFrames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    const glissAmountCents = this.calculateGlissando(pitchedGap) as Cents

    const pitchedCurrent = currentFrames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    const startTime = currentFrames[0]?.timestamp ?? (0 as TimestampMs)
    const landingErrorCents = this.calculateLandingError(pitchedCurrent, startTime) as Cents
    const correctionCount = this.calculateCorrectionCount(pitchedCurrent, startTime)

    return {
      transitionTimeMs,
      glissAmountCents,
      landingErrorCents,
      correctionCount,
    }
  }

  private calculateGlissando(gapFrames: PitchedFrame[]): number {
    if (gapFrames.length < 2) return 0
    let total = 0
    for (let i = 1; i < gapFrames.length; i++) {
      total += Math.abs(gapFrames[i].cents - gapFrames[i - 1].cents)
    }
    return total
  }

  private calculateLandingError(currentFrames: PitchedFrame[], startTime: TimestampMs): number {
    const firstStable = currentFrames.find(
      (f) => f.timestamp - startTime > this.options.settlingTimeMs,
    )
    if (!firstStable) return 0
    return Math.abs(firstStable.cents)
  }

  private calculateCorrectionCount(currentFrames: PitchedFrame[], startTime: TimestampMs): number {
    const window = currentFrames.filter(
      (f) => f.timestamp - startTime < this.options.settlingTimeMs,
    )
    let count = 0
    for (let i = 1; i < window.length; i++) {
      if (Math.sign(window[i].cents) !== Math.sign(window[i - 1].cents)) {
        count++
      }
    }
    return count
  }

  generateObservations(technique: NoteTechnique): Observation[] {
    const observations: Observation[] = [
      ...this.generateStabilityObservations(technique),
      ...this.generateVibratoObservations(technique),
      ...this.generateAttackObservations(technique),
      ...this.generateTransitionObservations(technique),
      ...this.generateResonanceObservations(technique),
      ...this.generateRhythmObservations(technique),
    ]

    return observations
      .sort((a, b) => b.severity * b.confidence - a.severity * a.confidence)
      .slice(0, 3)
  }

  private generateStabilityObservations(technique: NoteTechnique): Observation[] {
    const drift = technique.pitchStability.driftCentsPerSec
    if (Math.abs(drift) <= 15) return []
    return [
      {
        type: 'stability',
        severity: 2,
        confidence: 0.9 as Ratio01,
        message: drift > 0 ? 'Pitch is drifting sharp' : 'Pitch is drifting flat',
        tip: 'Maintain consistent finger pressure and bow speed.',
        evidence: { drift },
      },
    ]
  }

  private generateVibratoObservations(technique: NoteTechnique): Observation[] {
    const { present, rateHz, widthCents, regularity } = technique.vibrato
    if (present && rateHz !== undefined && widthCents !== undefined && regularity !== undefined) {
      if (rateHz < 4.5) {
        return [
          {
            type: 'vibrato',
            severity: 1,
            confidence: 0.8 as Ratio01,
            message: 'Slow vibrato detected',
            tip: 'Try to slightly increase the speed of your hand oscillation.',
            evidence: { rate: rateHz },
          },
        ]
      }
      if (widthCents > 35) {
        return [
          {
            type: 'vibrato',
            severity: 1,
            confidence: 0.8 as Ratio01,
            message: 'Wide vibrato detected',
            tip: 'Focus on a narrower, more controlled oscillation.',
            evidence: { width: widthCents },
          },
        ]
      }
    } else {
      // Logic for inconsistent vibrato if width is high but not present
      const width = technique.vibrato.widthCents ?? 0
      const reg = technique.vibrato.regularity ?? 0
      if (width > 10 && reg < 0.4) {
        return [
          {
            type: 'vibrato',
            severity: 2,
            confidence: 0.7 as Ratio01,
            message: 'Inconsistent vibrato',
            tip: 'Focus on a regular, relaxed movement of the wrist or arm.',
            evidence: { regularity: reg },
          },
        ]
      }
    }
    return []
  }

  private generateAttackObservations(technique: NoteTechnique): Observation[] {
    const obs: Observation[] = []
    if (technique.attackRelease.attackTimeMs > 200) {
      obs.push({
        type: 'attack',
        severity: 1,
        confidence: 0.9 as Ratio01,
        message: 'Slow note attack',
        tip: 'Start the note with more clarity and deliberate bow contact.',
        evidence: { attackTime: technique.attackRelease.attackTimeMs },
      })
    }
    if (Math.abs(technique.attackRelease.pitchScoopCents) > 15) {
      obs.push({
        type: 'attack',
        severity: 2,
        confidence: 0.85 as Ratio01,
        message:
          technique.attackRelease.pitchScoopCents < 0 ? 'Pitch scoops up' : 'Pitch drops down',
        tip: 'Ensure your finger is accurately placed before starting the bow.',
        evidence: { scoop: technique.attackRelease.pitchScoopCents },
      })
    }
    return obs
  }

  private generateTransitionObservations(technique: NoteTechnique): Observation[] {
    const obs: Observation[] = []
    if (technique.transition.glissAmountCents > 50 && technique.transition.transitionTimeMs > 120) {
      obs.push({
        type: 'transition',
        severity: 2,
        confidence: 0.8 as Ratio01,
        message: 'Audible glissando',
        tip: 'Move your hand more quickly between positions for a cleaner transition.',
        evidence: {
          gliss: technique.transition.glissAmountCents,
          time: technique.transition.transitionTimeMs,
        },
      })
    }
    if (technique.transition.landingErrorCents > 20) {
      obs.push({
        type: 'transition',
        severity: 2,
        confidence: 0.75 as Ratio01,
        message: 'Landing error',
        tip: 'Aim for the center of the new note immediately upon shifting.',
        evidence: { error: technique.transition.landingErrorCents },
      })
    }
    return obs
  }

  private generateResonanceObservations(technique: NoteTechnique): Observation[] {
    if (!technique.resonance.suspectedWolf) return []
    return [
      {
        type: 'resonance',
        severity: 3,
        confidence: 0.6 as Ratio01,
        message: 'Tone instability (Wolf-like resonance)',
        tip: 'Adjust your bow pressure, speed, or contact point to stabilize the tone.',
        evidence: {
          beating: technique.resonance.rmsBeatingScore,
          chaos: technique.resonance.pitchChaosScore,
        },
      },
    ]
  }

  private generateRhythmObservations(technique: NoteTechnique): Observation[] {
    if (Math.abs(technique.rhythm.onsetErrorMs) <= 60) return []
    return [
      {
        type: 'rhythm',
        severity: 2,
        confidence: 0.95 as Ratio01,
        message: technique.rhythm.onsetErrorMs > 0 ? 'Late note entry' : 'Early note entry',
        tip: 'Focus on the internal beat and prepare your fingers in advance.',
        evidence: { error: technique.rhythm.onsetErrorMs },
      },
    ]
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((a, b) => a + b) / values.length
    const squareDiffs = values.map((v) => (v - mean) ** 2)
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / values.length
    return Math.sqrt(avgSquareDiff)
  }

  private calculateDrift(frames: PitchedFrame[]): number {
    if (frames.length < 2) return 0
    const n = frames.length
    const startTime = frames[0].timestamp

    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    for (const f of frames) {
      const x = (f.timestamp - startTime) / 1000
      const y = f.cents
      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    }

    const denominator = n * sumXX - sumX * sumX
    if (Math.abs(denominator) < 1e-10) return 0

    return (n * sumXY - sumX * sumY) / denominator
  }

  private detrend(frames: PitchedFrame[]): number[] {
    const n = frames.length
    if (n === 0) return []
    const startTime = frames[0].timestamp

    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    for (const f of frames) {
      const x = (f.timestamp - startTime) / 1000
      const y = f.cents
      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    }

    const denominator = n * sumXX - sumX * sumX
    const slope = Math.abs(denominator) < 1e-10 ? 0 : (n * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / n

    return frames.map((f) => {
      const x = (f.timestamp - startTime) / 1000
      return f.cents - (intercept + slope * x)
    })
  }

  private findPeriod(
    values: number[],
    timestamps: number[],
  ): { periodMs: number; correlation: number } {
    let bestCorrelation = -1
    let bestPeriodMs = 0

    if (values.length < 4) return { periodMs: 0, correlation: 0 }
    const totalDuration = timestamps[timestamps.length - 1] - timestamps[0]
    const avgDt = totalDuration / (timestamps.length - 1)
    if (avgDt <= 0) return { periodMs: 0, correlation: 0 }

    const minPeriod = 100
    const maxPeriod = 250

    for (let periodMs = minPeriod; periodMs <= maxPeriod; periodMs += 2) {
      const lag = Math.round(periodMs / avgDt)
      if (lag >= values.length * 0.8 || lag <= 1) continue

      let dotProduct = 0
      let sqSum1 = 0
      let sqSum2 = 0

      for (let i = 0; i < values.length - lag; i++) {
        dotProduct += values[i] * values[i + lag]
        sqSum1 += values[i] * values[i]
        sqSum2 += values[i + lag] * values[i + lag]
      }

      const mag = Math.sqrt(sqSum1 * sqSum2)
      const corr = mag > 0 ? dotProduct / mag : 0

      if (corr > bestCorrelation) {
        bestCorrelation = corr
        bestPeriodMs = periodMs
      }
    }

    return { periodMs: bestPeriodMs, correlation: bestCorrelation }
  }
}
