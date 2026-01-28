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
  Observation
} from './technique-types'

export class TechniqueAnalysisAgent {
  analyzeSegment(segment: NoteSegment, gapFrames: TechniqueFrame[] = []): NoteTechnique {
    const frames = segment.frames

    return {
      vibrato: this.calculateVibrato(frames),
      pitchStability: this.calculateStability(frames),
      attackRelease: this.calculateAttackRelease(frames),
      resonance: this.calculateResonance(frames),
      rhythm: this.calculateRhythm(segment),
      transition: this.calculateTransition(gapFrames, frames),
    }
  }

  private calculateStability(frames: TechniqueFrame[]): PitchStability {
    if (frames.length === 0) {
      return { settlingStdCents: 0, globalStdCents: 0, driftCentsPerSec: 0, inTuneRatio: 0 }
    }

    const cents = frames.map(f => f.cents)
    const globalStd = this.calculateStdDev(cents)

    // Settling stability: use frames after 200ms
    const startTime = frames[0].timestamp
    const settlingFrames = frames.filter(f => f.timestamp - startTime > 200)
    const settlingCents = settlingFrames.length > 0 ? settlingFrames.map(f => f.cents) : cents
    const settlingStd = this.calculateStdDev(settlingCents)

    const drift = this.calculateDrift(frames)
    const inTuneRatio = frames.filter(f => Math.abs(f.cents) < 25).length / frames.length

    return {
      settlingStdCents: settlingStd,
      globalStdCents: globalStd,
      driftCentsPerSec: drift,
      inTuneRatio
    }
  }

  private calculateVibrato(frames: TechniqueFrame[]): VibratoMetrics {
    if (frames.length < 20) {
      return { present: false, rateHz: 0, widthCents: 0, regularity: 0 }
    }

    const duration = frames[frames.length - 1].timestamp - frames[0].timestamp
    if (duration < 400) {
      return { present: false, rateHz: 0, widthCents: 0, regularity: 0 }
    }

    const detrended = this.detrend(frames)
    const std = this.calculateStdDev(detrended)
    const widthCents = std * 2.828 // peak-to-peak for sine-like wave

    const { periodMs, correlation } = this.findPeriod(detrended, frames.map(f => f.timestamp))
    const rateHz = periodMs > 0 ? 1000 / periodMs : 0
    const regularity = Math.max(0, correlation)

    const present = rateHz >= 4 && rateHz <= 10 && widthCents > 8 && regularity > 0.5

    return { present, rateHz, widthCents, regularity }
  }

  private calculateAttackRelease(frames: TechniqueFrame[]): AttackReleaseMetrics {
    if (frames.length === 0) {
      return { attackTimeMs: 0, pitchScoopCents: 0, releaseStability: 0 }
    }

    const startTime = frames[0].timestamp
    const maxRms = Math.max(...frames.map(f => f.rms))
    const stableRmsThreshold = maxRms * 0.9

    // Attack Time
    let attackTimeMs = 0
    const stableFrame = frames.find(f => f.rms >= stableRmsThreshold)
    if (stableFrame) {
      attackTimeMs = stableFrame.timestamp - startTime
    }

    // Pitch Scoop: First 100ms vs frames after 200ms (stable)
    const earlyFrames = frames.filter(f => f.timestamp - startTime <= 100)
    const stableFrames = frames.filter(f => f.timestamp - startTime > 200)

    let pitchScoopCents = 0
    if (earlyFrames.length > 0 && stableFrames.length > 0) {
      const avgEarly = earlyFrames.reduce((sum, f) => sum + f.cents, 0) / earlyFrames.length
      const avgStable = stableFrames.reduce((sum, f) => sum + f.cents, 0) / stableFrames.length
      pitchScoopCents = avgEarly - avgStable
    }

    // Release Stability: Last 100ms
    const endTime = frames[frames.length - 1].timestamp
    const lateFrames = frames.filter(f => endTime - f.timestamp <= 100)
    const releaseStability = lateFrames.length > 0
      ? this.calculateStdDev(lateFrames.map(f => f.cents))
      : 0

    return {
      attackTimeMs,
      pitchScoopCents,
      releaseStability
    }
  }

  private calculateResonance(frames: TechniqueFrame[]): ResonanceMetrics {
    if (frames.length < 10) {
      return { suspectedWolf: false, rmsBeatingScore: 0, pitchChaosScore: 0, lowConfRatio: 0 }
    }

    const highRmsFrames = frames.filter(f => f.rms > 0.02)
    const lowConfRatio = highRmsFrames.length > 0
      ? highRmsFrames.filter(f => f.confidence < 0.6).length / highRmsFrames.length
      : 0

    const rmsValues = frames.map(f => f.rms)
    const meanRms = rmsValues.reduce((a, b) => a + b) / rmsValues.length
    const detrendedRms = rmsValues.map(v => v - meanRms)
    const { correlation: rmsBeatingScore } = this.findPeriod(detrendedRms, frames.map(f => f.timestamp))

    const detrendedCents = this.detrend(frames)
    const pitchChaosScore = this.calculateStdDev(detrendedCents)

    const suspectedWolf = lowConfRatio > 0.3 || (rmsBeatingScore > 0.6 && pitchChaosScore > 15)

    return {
      suspectedWolf,
      rmsBeatingScore: Math.max(0, rmsBeatingScore),
      pitchChaosScore,
      lowConfRatio
    }
  }

  private calculateRhythm(segment: NoteSegment): RhythmMetrics {
    const onsetErrorMs = segment.expectedStartTime !== undefined
      ? segment.startTime - segment.expectedStartTime
      : 0

    const durationErrorMs = segment.expectedDuration !== undefined
      ? (segment.endTime - segment.startTime) - segment.expectedDuration
      : undefined

    return {
      onsetErrorMs,
      durationErrorMs
    }
  }

  private calculateTransition(gapFrames: TechniqueFrame[], currentFrames: TechniqueFrame[]): TransitionMetrics {
    if (currentFrames.length === 0) {
      return { transitionTimeMs: 0, glissAmountCents: 0, landingErrorCents: 0, correctionCount: 0 }
    }

    const transitionTimeMs = gapFrames.length > 0
      ? gapFrames[gapFrames.length - 1].timestamp - gapFrames[0].timestamp
      : 0

    let glissAmountCents = 0
    if (gapFrames.length > 1) {
      const cents = gapFrames.filter(f => f.pitchHz > 0).map(f => f.cents)
      if (cents.length > 1) {
        glissAmountCents = Math.max(...cents) - Math.min(...cents)
      }
    }

    const startTime = currentFrames[0].timestamp
    const landingFrames = currentFrames.filter(f => f.timestamp - startTime <= 200)
    const landingErrorCents = landingFrames.length > 0
      ? landingFrames.reduce((sum, f) => sum + f.cents, 0) / landingFrames.length
      : 0

    let correctionCount = 0
    const correctionFrames = currentFrames.filter(f => f.timestamp - startTime <= 300)
    for (let i = 1; i < correctionFrames.length; i++) {
      if ((correctionFrames[i-1].cents > 0 && correctionFrames[i].cents < 0) ||
          (correctionFrames[i-1].cents < 0 && correctionFrames[i].cents > 0)) {
        correctionCount++
      }
    }

    return {
      transitionTimeMs,
      glissAmountCents,
      landingErrorCents,
      correctionCount
    }
  }

  generateObservations(technique: NoteTechnique): Observation[] {
    const observations: Observation[] = []

    if (Math.abs(technique.pitchStability.driftCentsPerSec) > 15) {
       observations.push({
         type: 'stability',
         severity: 2,
         confidence: 0.9,
         message: technique.pitchStability.driftCentsPerSec > 0 ? 'Pitch is drifting sharp' : 'Pitch is drifting flat',
         tip: 'Maintain consistent finger pressure and bow speed.'
       })
    }

    if (technique.vibrato.present) {
       if (technique.vibrato.rateHz < 4.5) {
          observations.push({
            type: 'vibrato',
            severity: 1,
            confidence: 0.8,
            message: 'Slow vibrato detected',
            tip: 'Try to slightly increase the speed of your hand oscillation.'
          })
       } else if (technique.vibrato.widthCents > 35) {
          observations.push({
            type: 'vibrato',
            severity: 1,
            confidence: 0.8,
            message: 'Wide vibrato detected',
            tip: 'Focus on a narrower, more controlled oscillation.'
          })
       }
    } else if (technique.vibrato.widthCents > 5 && technique.vibrato.regularity < 0.4) {
       observations.push({
            type: 'vibrato',
            severity: 2,
            confidence: 0.7,
            message: 'Inconsistent vibrato',
            tip: 'Focus on a regular, relaxed movement of the wrist or arm.'
       })
    }

    if (technique.attackRelease.attackTimeMs > 250) {
       observations.push({
         type: 'attack',
         severity: 1,
         confidence: 0.9,
         message: 'Slow note attack',
         tip: 'Start the note with more clarity and deliberate bow contact.'
       })
    }

    if (Math.abs(technique.attackRelease.pitchScoopCents) > 15) {
       observations.push({
         type: 'attack',
         severity: 2,
         confidence: 0.8,
         message: technique.attackRelease.pitchScoopCents < 0 ? 'Pitch scoops up' : 'Pitch drops down',
         tip: 'Ensure your finger is accurately placed before starting the bow.'
       })
    }

    if (technique.transition.glissAmountCents > 60 && technique.transition.transitionTimeMs > 100) {
       observations.push({
         type: 'transition',
         severity: 2,
         confidence: 0.8,
         message: 'Audible glissando',
         tip: 'Move your hand more quickly between positions for a cleaner transition.'
       })
    }

    if (technique.resonance.suspectedWolf) {
       observations.push({
         type: 'resonance',
         severity: 2,
         confidence: 0.6,
         message: 'Tone instability detected',
         tip: 'Adjust your bow pressure or contact point to stabilize the resonance.'
       })
    }

    return observations
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((a, b) => a + b) / values.length
    const squareDiffs = values.map(v => (v - mean) ** 2)
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

    const denominator = (n * sumXX - sumX * sumX)
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

    const denominator = (n * sumXX - sumX * sumX)
    const slope = Math.abs(denominator) < 1e-10 ? 0 : (n * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / n

    return frames.map(f => {
      const x = (f.timestamp - startTime) / 1000
      return f.cents - (intercept + slope * x)
    })
  }

  private findPeriod(values: number[], timestamps: number[]): { periodMs: number, correlation: number } {
    let bestCorrelation = -1
    let bestPeriodMs = 0

    if (values.length < 2) return { periodMs: 0, correlation: 0 }
    const totalDuration = timestamps[timestamps.length - 1] - timestamps[0]
    const avgDt = totalDuration / (timestamps.length - 1)
    if (avgDt <= 0) return { periodMs: 0, correlation: 0 }

    for (let periodMs = 100; periodMs <= 250; periodMs += 1) {
      const lag = Math.round(periodMs / avgDt)
      if (lag >= values.length * 0.7 || lag <= 0) continue

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
