import {
  TechniqueFrame,
  NoteSegment,
  NoteTechnique,
  VibratoMetrics,
  PitchStability,
  AttackReleaseMetrics,
  ResonanceMetrics,
  RhythmMetrics,
  TransitionMetrics,
  Observation,
} from './technique-types'

export interface AnalysisOptions {
  settlingTimeMs: number
  inTuneThresholdCents: number
  vibratoMinRateHz: number
  vibratoMaxRateHz: number
  vibratoMinWidthCents: number
  vibratoMinRegularity: number
}

const defaultOptions: AnalysisOptions = {
  settlingTimeMs: 200,
  inTuneThresholdCents: 25,
  vibratoMinRateHz: 4,
  vibratoMaxRateHz: 9,
  vibratoMinWidthCents: 8,
  vibratoMinRegularity: 0.5,
}

export class TechniqueAnalysisAgent {
  private options: AnalysisOptions

  constructor(options: Partial<AnalysisOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  /**
   * Performs technical analysis on a completed note segment.
   *
   * @param segment - The current note segment to analyze.
   * @param gapFrames - The frames between the previous note and the current one (transitions).
   * @param prevSegment - The preceding note segment for contextual analysis.
   * @returns A `NoteTechnique` object containing all calculated metrics.
   */
  analyzeSegment(
    segment: NoteSegment,
    gapFrames: TechniqueFrame[] = [],
    prevSegment: NoteSegment | null = null,
  ): NoteTechnique {
    const frames = segment.frames

    return {
      vibrato: this.calculateVibrato(frames),
      pitchStability: this.calculateStability(frames),
      attackRelease: this.calculateAttackRelease(frames),
      resonance: this.calculateResonance(frames),
      rhythm: this.calculateRhythm(segment),
      transition: this.calculateTransition(gapFrames, frames, prevSegment),
    }
  }

  private calculateStability(frames: TechniqueFrame[]): PitchStability {
    if (frames.length === 0) {
      return { settlingStdCents: 0, globalStdCents: 0, driftCentsPerSec: 0, inTuneRatio: 0 }
    }

    const cents = frames.map((f) => f.cents)
    const globalStd = this.calculateStdDev(cents)

    // Settling stability: use frames after configured settling time
    const startTime = frames[0].timestamp
    const settlingFrames = frames.filter((f) => f.timestamp - startTime > this.options.settlingTimeMs)
    const settlingCents = settlingFrames.length > 0 ? settlingFrames.map((f) => f.cents) : cents
    const settlingStd = this.calculateStdDev(settlingCents)

    const drift = this.calculateDrift(frames)
    const inTuneRatio =
      frames.filter((f) => Math.abs(f.cents) < this.options.inTuneThresholdCents).length /
      frames.length

    return {
      settlingStdCents: settlingStd,
      globalStdCents: globalStd,
      driftCentsPerSec: drift,
      inTuneRatio,
    }
  }

  private calculateVibrato(frames: TechniqueFrame[]): VibratoMetrics {
    if (frames.length < 20) {
      return { present: false, rateHz: 0, widthCents: 0, regularity: 0 }
    }

    const duration = frames[frames.length - 1].timestamp - frames[0].timestamp
    // Vibrato needs at least 500ms to be reliably detected
    if (duration < 500) {
      return { present: false, rateHz: 0, widthCents: 0, regularity: 0 }
    }

    // CRITICAL: Gate vibrato detection by pitch stability
    // True vibrato oscillates around a stable center (stdDev < 40 cents)
    // High global deviation indicates tuning chaos, not expressive technique
    const pitchStd = this.calculateStdDev(frames.map((f) => f.cents))
    if (pitchStd > 40) {
      return { present: false, rateHz: 0, widthCents: 0, regularity: 0 }
    }

    const detrended = this.detrend(frames)
    // Robust width: 2 * std covers ~95% of a sine wave's peak-to-peak if noise is low
    // std * 2.828 is more precise for pure sine (sqrt(2)*2)
    const std = this.calculateStdDev(detrended)
    const widthCents = std * 2.828

    const { periodMs, correlation } = this.findPeriod(detrended, frames.map((f) => f.timestamp))
    const rateHz = periodMs > 0 ? 1000 / periodMs : 0
    const regularity = Math.max(0, correlation)

    const present =
      rateHz >= this.options.vibratoMinRateHz &&
      rateHz <= this.options.vibratoMaxRateHz &&
      widthCents >= this.options.vibratoMinWidthCents &&
      regularity >= this.options.vibratoMinRegularity

    return { present, rateHz, widthCents, regularity }
  }

  private calculateAttackRelease(frames: TechniqueFrame[]): AttackReleaseMetrics {
    if (frames.length === 0) {
      return { attackTimeMs: 0, pitchScoopCents: 0, releaseStability: 0 }
    }

    const startTime = frames[0].timestamp
    const rmsValues = frames.map((f) => f.rms)
    const maxRms = Math.max(...rmsValues)

    // Find "stable" RMS: average of middle 50% of frames
    const middleFrames = frames.slice(
      Math.floor(frames.length * 0.25),
      Math.floor(frames.length * 0.75),
    )
    const stableRms =
      middleFrames.length > 0
        ? middleFrames.reduce((sum, f) => sum + f.rms, 0) / middleFrames.length
        : maxRms

    const stableRmsThreshold = stableRms * 0.85

    // Attack Time: From onset to reaching 85% of stable RMS
    let attackTimeMs = 0
    const stableFrame = frames.find((f) => f.rms >= stableRmsThreshold)
    if (stableFrame) {
      attackTimeMs = stableFrame.timestamp - startTime
    }

    // Pitch Scoop: First 150ms vs frames after settling time
    const earlyFrames = frames.filter((f) => f.timestamp - startTime <= 150)
    const stableFrames = frames.filter((f) => f.timestamp - startTime > this.options.settlingTimeMs)

    let pitchScoopCents = 0
    if (earlyFrames.length > 0 && stableFrames.length > 0) {
      const avgEarly = earlyFrames.reduce((sum, f) => sum + f.cents, 0) / earlyFrames.length
      const avgStable = stableFrames.reduce((sum, f) => sum + f.cents, 0) / stableFrames.length
      pitchScoopCents = avgEarly - avgStable
    }

    // Release Stability: Last 100ms before offset
    const endTime = frames[frames.length - 1].timestamp
    const lateFrames = frames.filter((f) => endTime - f.timestamp <= 100)
    const releaseStability =
      lateFrames.length > 0 ? this.calculateStdDev(lateFrames.map((f) => f.cents)) : 0

    return {
      attackTimeMs,
      pitchScoopCents,
      releaseStability,
    }
  }

  private calculateResonance(frames: TechniqueFrame[]): ResonanceMetrics {
    if (frames.length < 10) {
      return { suspectedWolf: false, rmsBeatingScore: 0, pitchChaosScore: 0, lowConfRatio: 0 }
    }

    const highRmsFrames = frames.filter((f) => f.rms > 0.02)
    const lowConfRatio =
      highRmsFrames.length > 0
        ? highRmsFrames.filter((f) => f.confidence < 0.6).length / highRmsFrames.length
        : 0

    const rmsValues = frames.map((f) => f.rms)
    const meanRms = rmsValues.reduce((a, b) => a + b) / rmsValues.length
    const detrendedRms = rmsValues.map((v) => v - meanRms)
    const { correlation: rmsBeatingScore } = this.findPeriod(
      detrendedRms,
      frames.map((f) => f.timestamp),
    )

    const detrendedCents = this.detrend(frames)
    const pitchChaosScore = this.calculateStdDev(detrendedCents)

    // A wolf tone typically shows combined evidence:
    // 1. High RMS but low confidence (phase cancellation)
    // 2. Beating (amplitude modulation in the 4-12Hz range)
    // 3. Pitch chaos (unstable frequency)
    const suspectedWolf =
      (lowConfRatio > 0.3 && rmsBeatingScore > 0.4) || (rmsBeatingScore > 0.6 && pitchChaosScore > 20)

    return {
      suspectedWolf,
      rmsBeatingScore: Math.max(0, rmsBeatingScore),
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
    gapFrames: TechniqueFrame[],
    currentFrames: TechniqueFrame[],
    _prevSegment: NoteSegment | null,
  ): TransitionMetrics {
    if (currentFrames.length === 0) {
      return { transitionTimeMs: 0, glissAmountCents: 0, landingErrorCents: 0, correctionCount: 0 }
    }

    const transitionTimeMs =
      gapFrames.length > 0 ? gapFrames[gapFrames.length - 1].timestamp - gapFrames[0].timestamp : 0

    let glissAmountCents = 0
    if (gapFrames.length > 1) {
      const cents = gapFrames.filter((f) => f.pitchHz > 0).map((f) => f.cents)
      if (cents.length > 1) {
        glissAmountCents = Math.max(...cents) - Math.min(...cents)
      }
    }

    const startTime = currentFrames[0].timestamp
    const landingFrames = currentFrames.filter((f) => f.timestamp - startTime <= 200)
    const landingErrorCents =
      landingFrames.length > 0
        ? landingFrames.reduce((sum, f) => sum + f.cents, 0) / landingFrames.length
        : 0

    let correctionCount = 0
    const correctionFrames = currentFrames.filter((f) => f.timestamp - startTime <= 300)
    for (let i = 1; i < correctionFrames.length; i++) {
      if (
        (correctionFrames[i - 1].cents > 0 && correctionFrames[i].cents < 0) ||
        (correctionFrames[i - 1].cents < 0 && correctionFrames[i].cents > 0)
      ) {
        correctionCount++
      }
    }

    return {
      transitionTimeMs,
      glissAmountCents,
      landingErrorCents,
      correctionCount,
    }
  }

  /**
   * Generates a list of pedagogical observations based on technical metrics.
   *
   * @remarks
   * This method implements the intelligent feedback motor. It identifies technical
   * flaws, assigns severity and confidence levels, and ranks them to ensure
   * the most critical and certain feedback is presented first.
   */
  generateObservations(technique: NoteTechnique): Observation[] {
    const observations: Observation[] = []

    // 1. Stability & Drift
    if (Math.abs(technique.pitchStability.driftCentsPerSec) > 15) {
      observations.push({
        type: 'stability',
        severity: 2,
        confidence: 0.9,
        message:
          technique.pitchStability.driftCentsPerSec > 0
            ? 'Pitch is drifting sharp'
            : 'Pitch is drifting flat',
        tip: 'Maintain consistent finger pressure and bow speed.',
        evidence: { drift: technique.pitchStability.driftCentsPerSec },
      })
    }

    // 2. Vibrato
    if (technique.vibrato.present) {
      if (technique.vibrato.rateHz < 4.5) {
        observations.push({
          type: 'vibrato',
          severity: 1,
          confidence: 0.8,
          message: 'Slow vibrato detected',
          tip: 'Try to slightly increase the speed of your hand oscillation.',
          evidence: { rate: technique.vibrato.rateHz },
        })
      } else if (technique.vibrato.widthCents > 35) {
        observations.push({
          type: 'vibrato',
          severity: 1,
          confidence: 0.8,
          message: 'Wide vibrato detected',
          tip: 'Focus on a narrower, more controlled oscillation.',
          evidence: { width: technique.vibrato.widthCents },
        })
      }
    } else if (technique.vibrato.widthCents > 10 && technique.vibrato.regularity < 0.4) {
      observations.push({
        type: 'vibrato',
        severity: 2,
        confidence: 0.7,
        message: 'Inconsistent vibrato',
        tip: 'Focus on a regular, relaxed movement of the wrist or arm.',
        evidence: { regularity: technique.vibrato.regularity },
      })
    }

    // 3. Attack & Release
    if (technique.attackRelease.attackTimeMs > 200) {
      observations.push({
        type: 'attack',
        severity: 1,
        confidence: 0.9,
        message: 'Slow note attack',
        tip: 'Start the note with more clarity and deliberate bow contact.',
        evidence: { attackTime: technique.attackRelease.attackTimeMs },
      })
    }

    if (Math.abs(technique.attackRelease.pitchScoopCents) > 15) {
      observations.push({
        type: 'attack',
        severity: 2,
        confidence: 0.85,
        message:
          technique.attackRelease.pitchScoopCents < 0 ? 'Pitch scoops up' : 'Pitch drops down',
        tip: 'Ensure your finger is accurately placed before starting the bow.',
        evidence: { scoop: technique.attackRelease.pitchScoopCents },
      })
    }

    // 4. Transitions
    if (technique.transition.glissAmountCents > 50 && technique.transition.transitionTimeMs > 120) {
      observations.push({
        type: 'transition',
        severity: 2,
        confidence: 0.8,
        message: 'Audible glissando',
        tip: 'Move your hand more quickly between positions for a cleaner transition.',
        evidence: {
          gliss: technique.transition.glissAmountCents,
          time: technique.transition.transitionTimeMs,
        },
      })
    }

    if (technique.transition.landingErrorCents > 20) {
      observations.push({
        type: 'transition',
        severity: 2,
        confidence: 0.75,
        message: 'Landing error',
        tip: 'Aim for the center of the new note immediately upon shifting.',
        evidence: { error: technique.transition.landingErrorCents },
      })
    }

    // 5. Resonance
    if (technique.resonance.suspectedWolf) {
      observations.push({
        type: 'resonance',
        severity: 3,
        confidence: 0.6,
        message: 'Tone instability (Wolf-like resonance)',
        tip: 'Adjust your bow pressure, speed, or contact point to stabilize the tone.',
        evidence: {
          beating: technique.resonance.rmsBeatingScore,
          chaos: technique.resonance.pitchChaosScore,
        },
      })
    }

    // 6. Rhythm
    if (Math.abs(technique.rhythm.onsetErrorMs) > 60) {
      observations.push({
        type: 'rhythm',
        severity: 2,
        confidence: 0.95,
        message: technique.rhythm.onsetErrorMs > 0 ? 'Late note entry' : 'Early note entry',
        tip: 'Focus on the internal beat and prepare your fingers in advance.',
        evidence: { error: technique.rhythm.onsetErrorMs },
      })
    }

    // Prioritize and rank observations
    return observations
      .sort((a, b) => {
        const scoreA = a.severity * a.confidence
        const scoreB = b.severity * b.confidence
        return scoreB - scoreA
      })
      .slice(0, 3) // Limit to top 3 for the specific note
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((a, b) => a + b) / values.length
    const squareDiffs = values.map((v) => (v - mean) ** 2)
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / values.length
    return Math.sqrt(avgSquareDiff)
  }

  private calculateDrift(frames: TechniqueFrame[]): number {
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

    const slope = (n * sumXY - sumX * sumY) / denominator
    return slope
  }

  private detrend(frames: TechniqueFrame[]): number[] {
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

    // Search range: 4Hz to 10Hz (100ms to 250ms)
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

      // We want the HIGHEST correlation in the expected range
      if (corr > bestCorrelation) {
        bestCorrelation = corr
        bestPeriodMs = periodMs
      }
    }

    return { periodMs: bestPeriodMs, correlation: bestCorrelation }
  }
}
