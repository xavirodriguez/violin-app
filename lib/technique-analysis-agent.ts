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
  analyzeSegment(params: {
    segment: NoteSegment
    gapFrames?: ReadonlyArray<TechniqueFrame>
    prevSegment?: NoteSegment
  }): NoteTechnique {
    const { segment, gapFrames = [], prevSegment } = params
    const frames = segment.frames
    const pitchedFrames = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')

    return {
      vibrato: this.calculateVibrato(pitchedFrames),
      pitchStability: this.calculateStability(pitchedFrames),
      attackRelease: this.calculateAttackRelease(frames),
      resonance: this.calculateResonance(pitchedFrames),
      rhythm: this.calculateRhythm(segment),
      transition: this.calculateTransition(gapFrames, frames, prevSegment),
    }
  }

  /**
   * Generates a set of user-facing observations from the technique metrics.
   */
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

  private calculateStability(frames: PitchedFrame[]): PitchStability {
    if (frames.length === 0) return this.createEmptyStability()

    const globalStd = this.calculateStdDev(frames.map((f) => f.cents)) as Cents
    const settlingStd = this.calculateSettlingStd(frames) as Cents
    const { slope: drift } = this.performLinearRegression(frames)
    const inTuneRatio = this.calculateInTuneRatio(frames)

    return {
      settlingStdCents: settlingStd,
      globalStdCents: globalStd,
      driftCentsPerSec: drift,
      inTuneRatio,
    }
  }

  private calculateSettlingStd(frames: PitchedFrame[]): number {
    const startTime = frames[0].timestamp
    const settlingFrames = frames.filter(
      (f) => f.timestamp - startTime > this.options.settlingTimeMs,
    )
    const cents = settlingFrames.length > 0 ? settlingFrames.map((f) => f.cents) : frames.map((f) => f.cents)
    return this.calculateStdDev(cents)
  }

  private calculateInTuneRatio(frames: PitchedFrame[]): Ratio01 {
    const inTuneCount = frames.filter(
      (f) => Math.abs(f.cents) < this.options.inTuneThresholdCents
    ).length
    return (inTuneCount / frames.length) as Ratio01
  }

  private createEmptyStability(): PitchStability {
    return {
      settlingStdCents: 0 as Cents,
      globalStdCents: 0 as Cents,
      driftCentsPerSec: 0,
      inTuneRatio: 0 as Ratio01,
    }
  }

  private calculateVibrato(frames: PitchedFrame[]): VibratoMetrics {
    if (!this.isVibratoCandidate(frames)) return { present: false }

    const detrended = this.detrend(frames)
    const widthCents = (this.calculateStdDev(detrended) * 2.828) as Cents
    const { periodMs, correlation } = this.findPeriod(detrended, frames.map((f) => f.timestamp))
    const rateHz = (periodMs > 0 ? 1000 / periodMs : 0) as Hz
    const regularity = Math.max(0, correlation) as Ratio01

    const isValid = this.isVibratoValid(rateHz, widthCents, regularity)

    return {
      present: isValid,
      rateHz: isValid ? rateHz : undefined,
      widthCents: isValid ? widthCents : undefined,
      regularity: isValid ? regularity : undefined,
    }
  }

  private isVibratoCandidate(frames: PitchedFrame[]): boolean {
    if (frames.length < 20) return false
    const duration = frames[frames.length - 1].timestamp - frames[0].timestamp
    if (duration < 500) return false
    const pitchStd = this.calculateStdDev(frames.map((f) => f.cents))
    return pitchStd <= 40
  }

  private isVibratoValid(rateHz: Hz, widthCents: Cents, regularity: Ratio01): boolean {
    return rateHz >= this.options.vibratoMinRateHz &&
      rateHz <= this.options.vibratoMaxRateHz &&
      widthCents >= this.options.vibratoMinWidthCents &&
      regularity >= this.options.vibratoMinRegularity
  }

  private calculateAttackRelease(frames: ReadonlyArray<TechniqueFrame>): AttackReleaseMetrics {
    if (frames.length === 0) {
      return {
        attackTimeMs: 0 as TimestampMs,
        pitchScoopCents: 0 as Cents,
        releaseStability: 0 as Cents,
      }
    }

    const pitchedFrames = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    const { attackTimeMs, pitchScoopCents } = this.analyzeAttackPhase(frames, pitchedFrames)
    const releaseStability = this.analyzeReleasePhase(pitchedFrames, frames[frames.length - 1].timestamp)

    return { attackTimeMs, pitchScoopCents, releaseStability }
  }

  private analyzeAttackPhase(
    frames: ReadonlyArray<TechniqueFrame>,
    pitchedFrames: PitchedFrame[]
  ): { attackTimeMs: TimestampMs; pitchScoopCents: Cents } {
    const startTime = frames[0].timestamp
    const attackTimeMs = this.calculateAttackTime(frames, startTime)
    const pitchScoopCents = this.calculatePitchScoop(pitchedFrames, startTime)
    return { attackTimeMs, pitchScoopCents }
  }

  private calculateAttackTime(frames: ReadonlyArray<TechniqueFrame>, startTime: TimestampMs): TimestampMs {
    const stableRmsThreshold = this.calculateStableRms(frames) * 0.85
    const stableFrame = frames.find(f => f.rms >= stableRmsThreshold)
    return stableFrame ? (stableFrame.timestamp - startTime) as TimestampMs : 0 as TimestampMs
  }

  private calculateStableRms(frames: ReadonlyArray<TechniqueFrame>): number {
    const middleFrames = frames.slice(
      Math.floor(frames.length * 0.25),
      Math.floor(frames.length * 0.75),
    )

    if (middleFrames.length === 0) {
      return Math.max(...frames.map(f => f.rms))
    }

    return middleFrames.reduce((sum, f) => sum + f.rms, 0) / middleFrames.length
  }

  private calculatePitchScoop(pitchedFrames: PitchedFrame[], startTime: TimestampMs): Cents {
    const earlyPitched = pitchedFrames.filter(f => f.timestamp - startTime <= 150)
    const stablePitched = pitchedFrames.filter(f => f.timestamp - startTime > this.options.settlingTimeMs)

    if (earlyPitched.length === 0 || stablePitched.length === 0) {
      return 0 as Cents
    }

    const avgEarly = earlyPitched.reduce((sum, f) => sum + f.cents, 0) / earlyPitched.length
    const avgStable = stablePitched.reduce((sum, f) => sum + f.cents, 0) / stablePitched.length
    return (avgEarly - avgStable) as Cents
  }

  private analyzeReleasePhase(pitchedFrames: PitchedFrame[], endTime: TimestampMs): Cents {
    const latePitched = pitchedFrames.filter(f => endTime - f.timestamp <= 100)
    return latePitched.length > 0
      ? (this.calculateStdDev(latePitched.map(f => f.cents)) as Cents)
      : (0 as Cents)
  }

  private calculateResonance(frames: PitchedFrame[]): ResonanceMetrics {
    if (frames.length < 10) return this.createEmptyResonance()

    const lowConfRatio = this.calculateLowConfRatio(frames)
    const rmsBeatingScore = this.calculateRmsBeatingScore(frames)
    const pitchChaosScore = this.calculateStdDev(this.detrend(frames))
    const suspectedWolf = this.detectWolfTone(lowConfRatio, rmsBeatingScore, pitchChaosScore)

    return {
      suspectedWolf,
      rmsBeatingScore,
      pitchChaosScore,
      lowConfRatio,
    }
  }

  private createEmptyResonance(): ResonanceMetrics {
    return {
      suspectedWolf: false,
      rmsBeatingScore: 0 as Ratio01,
      pitchChaosScore: 0,
      lowConfRatio: 0 as Ratio01
    }
  }

  private calculateLowConfRatio(frames: PitchedFrame[]): Ratio01 {
    const highRmsFrames = frames.filter((f) => f.rms > 0.02)
    if (highRmsFrames.length === 0) return 0 as Ratio01
    const lowConfCount = highRmsFrames.filter((f) => f.confidence < 0.6).length
    return (lowConfCount / highRmsFrames.length) as Ratio01
  }

  private calculateRmsBeatingScore(frames: PitchedFrame[]): Ratio01 {
    const rmsValues = frames.map((f) => f.rms)
    const meanRms = rmsValues.reduce((a, b) => a + b) / rmsValues.length
    const detrendedRms = rmsValues.map(v => v - meanRms)
    const { correlation } = this.findPeriod(detrendedRms, frames.map(f => f.timestamp))
    return Math.max(0, correlation) as Ratio01
  }

  private detectWolfTone(lowConfRatio: number, rmsBeatingScore: number, pitchChaosScore: number): boolean {
    return (lowConfRatio > 0.3 && rmsBeatingScore > 0.4) ||
      (rmsBeatingScore > 0.6 && pitchChaosScore > 20)
  }

  private calculateRhythm(segment: NoteSegment): RhythmMetrics {
    const onsetErrorMs =
      segment.expectedStartTime !== undefined ? segment.startTime - segment.expectedStartTime : 0

    const durationErrorMs =
      segment.expectedDuration !== undefined
        ? segment.endTime - segment.startTime - segment.expectedDuration
        : undefined

    return { onsetErrorMs, durationErrorMs }
  }

  private calculateTransition(
    gapFrames: ReadonlyArray<TechniqueFrame>,
    currentFrames: ReadonlyArray<TechniqueFrame>,
    _prevSegment: NoteSegment | undefined,
  ): TransitionMetrics {
    const transitionTimeMs = this.calculateTransitionTime(gapFrames)
    const glissAmountCents = this.calculateGlissAmount(gapFrames)
    const landingErrorCents = this.calculateLandingErrorMetric(currentFrames)
    const correctionCount = this.calculateCorrectionMetric(currentFrames)

    return { transitionTimeMs, glissAmountCents, landingErrorCents, correctionCount }
  }

  private calculateTransitionTime(gapFrames: ReadonlyArray<TechniqueFrame>): TimestampMs {
    if (gapFrames.length < 2) return 0 as TimestampMs
    return (gapFrames[gapFrames.length - 1].timestamp - gapFrames[0].timestamp) as TimestampMs
  }

  private calculateGlissAmount(gapFrames: ReadonlyArray<TechniqueFrame>): Cents {
    const pitchedGap = gapFrames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    return this.calculateGlissando(pitchedGap) as Cents
  }

  private calculateLandingErrorMetric(currentFrames: ReadonlyArray<TechniqueFrame>): Cents {
    const pitchedCurrent = currentFrames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    const startTime = currentFrames[0]?.timestamp ?? (0 as TimestampMs)
    return this.calculateLandingError(pitchedCurrent, startTime) as Cents
  }

  private calculateCorrectionMetric(currentFrames: ReadonlyArray<TechniqueFrame>): number {
    const pitchedCurrent = currentFrames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    const startTime = currentFrames[0]?.timestamp ?? (0 as TimestampMs)
    return this.calculateCorrectionCount(pitchedCurrent, startTime)
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
    return firstStable ? Math.abs(firstStable.cents) : 0
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


  private generateStabilityObservations(technique: NoteTechnique): Observation[] {
    const drift = technique.pitchStability.driftCentsPerSec
    if (Math.abs(drift) <= 15) return []
    return [{
      type: 'stability',
      severity: 2,
      confidence: 0.9 as Ratio01,
      message: drift > 0 ? 'Pitch is drifting sharp' : 'Pitch is drifting flat',
      tip: 'Maintain consistent finger pressure and bow speed.',
      evidence: { drift },
    }]
  }

  private generateVibratoObservations(technique: NoteTechnique): Observation[] {
    const { present, rateHz, widthCents, regularity } = technique.vibrato
    if (present && rateHz !== undefined && widthCents !== undefined && regularity !== undefined) {
      return this.analyzePresentVibrato(rateHz, widthCents)
    }
    return this.analyzeInconsistentVibrato(technique.vibrato)
  }

  private analyzePresentVibrato(rateHz: number, widthCents: number): Observation[] {
    if (rateHz < 4.5) {
      return [{
        type: 'vibrato',
        severity: 1,
        confidence: 0.8 as Ratio01,
        message: 'Slow vibrato detected',
        tip: 'Try to slightly increase the speed of your hand oscillation.',
        evidence: { rate: rateHz }
      }]
    }
    if (widthCents > 35) {
      return [{
        type: 'vibrato',
        severity: 1,
        confidence: 0.8 as Ratio01,
        message: 'Wide vibrato detected',
        tip: 'Focus on a narrower, more controlled oscillation.',
        evidence: { width: widthCents }
      }]
    }
    return []
  }

  private analyzeInconsistentVibrato(vibrato: VibratoMetrics): Observation[] {
    const width = vibrato.widthCents ?? 0
    const reg = vibrato.regularity ?? 0
    if (width > 10 && reg < 0.4) {
      return [{
        type: 'vibrato',
        severity: 2,
        confidence: 0.7 as Ratio01,
        message: 'Inconsistent vibrato',
        tip: 'Focus on a regular, relaxed movement of the wrist or arm.',
        evidence: { regularity: reg }
      }]
    }
    return []
  }

  private generateAttackObservations(technique: NoteTechnique): Observation[] {
    return [
      ...this.analyzeSlowAttack(technique.attackRelease.attackTimeMs),
      ...this.analyzePitchScoop(technique.attackRelease.pitchScoopCents),
    ]
  }

  private analyzeSlowAttack(attackTimeMs: TimestampMs): Observation[] {
    if (attackTimeMs <= 200) return []
    return [{
      type: 'attack',
      severity: 1,
      confidence: 0.9 as Ratio01,
      message: 'Slow note attack',
      tip: 'Start the note with more clarity and deliberate bow contact.',
      evidence: { attackTime: attackTimeMs }
    }]
  }

  private analyzePitchScoop(pitchScoopCents: Cents): Observation[] {
    if (Math.abs(pitchScoopCents) <= 15) return []
    return [{
      type: 'attack',
      severity: 2,
      confidence: 0.85 as Ratio01,
      message: pitchScoopCents < 0 ? 'Pitch scoops up' : 'Pitch drops down',
      tip: 'Ensure your finger is accurately placed before starting the bow.',
      evidence: { scoop: pitchScoopCents }
    }]
  }

  private generateTransitionObservations(technique: NoteTechnique): Observation[] {
    return [
      ...this.analyzeAudibleGlissando(technique.transition),
      ...this.analyzeLandingError(technique.transition.landingErrorCents),
    ]
  }

  private analyzeAudibleGlissando(transition: TransitionMetrics): Observation[] {
    if (transition.glissAmountCents <= 50 || transition.transitionTimeMs <= 120) return []
    return [{
      type: 'transition',
      severity: 2,
      confidence: 0.8 as Ratio01,
      message: 'Audible glissando',
      tip: 'Move your hand more quickly between positions for a cleaner transition.',
      evidence: {
        gliss: transition.glissAmountCents,
        time: transition.transitionTimeMs
      }
    }]
  }

  private analyzeLandingError(landingErrorCents: Cents): Observation[] {
    if (landingErrorCents <= 20) return []
    return [{
      type: 'transition',
      severity: 2,
      confidence: 0.75 as Ratio01,
      message: 'Landing error',
      tip: 'Aim for the center of the new note immediately upon shifting.',
      evidence: { error: landingErrorCents }
    }]
  }

  private generateResonanceObservations(technique: NoteTechnique): Observation[] {
    if (!technique.resonance.suspectedWolf) return []
    return [{
      type: 'resonance',
      severity: 3,
      confidence: 0.6 as Ratio01,
      message: 'Tone instability (Wolf-like resonance)',
      tip: 'Adjust your bow pressure, speed, or contact point to stabilize the tone.',
      evidence: {
        beating: technique.resonance.rmsBeatingScore,
        chaos: technique.resonance.pitchChaosScore
      }
    }]
  }

  private generateRhythmObservations(technique: NoteTechnique): Observation[] {
    if (Math.abs(technique.rhythm.onsetErrorMs) <= 60) return []
    return [{
      type: 'rhythm',
      severity: 2,
      confidence: 0.95 as Ratio01,
      message: technique.rhythm.onsetErrorMs > 0 ? 'Late note entry' : 'Early note entry',
      tip: 'Focus on the internal beat and prepare your fingers in advance.',
      evidence: { error: technique.rhythm.onsetErrorMs }
    }]
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((a, b) => a + b) / values.length
    const squareDiffs = values.map((v) => (v - mean) ** 2)
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / values.length
    return Math.sqrt(avgSquareDiff)
  }

  private performLinearRegression(frames: PitchedFrame[]): { slope: number; intercept: number } {
    const n = frames.length
    if (n < 2) return { slope: 0, intercept: 0 }
    const startTime = frames[0].timestamp

    const sums = this.calculateRegressionSums(frames, startTime)
    const denominator = n * sums.sumXX - sums.sumX * sums.sumX

    if (Math.abs(denominator) < 1e-10) return { slope: 0, intercept: sums.sumY / n }

    const slope = (n * sums.sumXY - sums.sumX * sums.sumY) / denominator
    const intercept = (sums.sumY - slope * sums.sumX) / n
    return { slope, intercept }
  }

  private calculateRegressionSums(frames: PitchedFrame[], startTime: TimestampMs) {
    return frames.reduce((acc, f) => {
      const x = (f.timestamp - startTime) / 1000
      const y = f.cents
      return {
        sumX: acc.sumX + x,
        sumY: acc.sumY + y,
        sumXY: acc.sumXY + x * y,
        sumXX: acc.sumXX + x * x,
      }
    }, { sumX: 0, sumY: 0, sumXY: 0, sumXX: 0 })
  }

  private detrend(frames: PitchedFrame[]): number[] {
    const { slope, intercept } = this.performLinearRegression(frames)
    const startTime = frames[0]?.timestamp ?? 0
    return frames.map((f) => {
      const x = (f.timestamp - startTime) / 1000
      return f.cents - (intercept + slope * x)
    })
  }

  private findPeriod(
    values: number[],
    timestamps: number[],
  ): { periodMs: number; correlation: number } {
    if (values.length < 4) return { periodMs: 0, correlation: 0 }
    const avgDt = (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1)
    if (avgDt <= 0) return { periodMs: 0, correlation: 0 }

    let best = { correlation: -1, periodMs: 0 }
    for (let periodMs = 100; periodMs <= 250; periodMs += 2) {
      const result = this.evaluatePeriod(values, periodMs, avgDt)
      if (result.correlation > best.correlation) {
        best = result
      }
    }
    return best
  }

  private evaluatePeriod(values: number[], periodMs: number, avgDt: number) {
    const lag = Math.round(periodMs / avgDt)
    if (lag >= values.length * 0.8 || lag <= 1) {
      return { correlation: -1, periodMs }
    }
    return { correlation: this.calculateAutocorrelation(values, lag), periodMs }
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    let dotProduct = 0
    let sqSum1 = 0
    let sqSum2 = 0

    for (let i = 0; i < values.length - lag; i++) {
      dotProduct += values[i] * values[i + lag]
      sqSum1 += values[i] * values[i]
      sqSum2 += values[i + lag] * values[i + lag]
    }

    const mag = Math.sqrt(sqSum1 * sqSum2)
    return mag > 0 ? dotProduct / mag : 0
  }
}
