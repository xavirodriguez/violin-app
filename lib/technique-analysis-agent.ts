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
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
    this.options = mergedOptions

    const isInitialized = !!this.options
    if (!isInitialized) {
      const errorMsg = 'Analysis agent initialization failed'
      throw new Error(errorMsg)
    }
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
    const pitched = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')

    const technique = this.buildTechniqueObject({ segment, frames, pitched, gapFrames, prevSegment })
    return technique
  }

  /**
   * Generates a set of user-facing observations from the technique metrics.
   */
  generateObservations(technique: NoteTechnique): Observation[] {
    const all = this.collectObservations(technique)
    const prioritized = this.prioritizeObservations(all)
    const result = prioritized

    return result
  }

  private buildTechniqueObject(params: {
    segment: NoteSegment
    frames: readonly TechniqueFrame[]
    pitched: PitchedFrame[]
    gapFrames: ReadonlyArray<TechniqueFrame>
    prevSegment?: NoteSegment
  }): NoteTechnique {
    const { segment, frames, pitched, gapFrames, prevSegment } = params
    return {
      vibrato: this.calculateVibrato(pitched),
      pitchStability: this.calculateStability(pitched),
      attackRelease: this.calculateAttackRelease(frames),
      resonance: this.calculateResonance(pitched),
      rhythm: this.calculateRhythm(segment),
      transition: this.calculateTransition({ gapFrames, currentFrames: frames, prevSegment }),
    }
  }

  private collectObservations(technique: NoteTechnique): Observation[] {
    const observations = [
      ...this.generateStabilityObservations(technique),
      ...this.generateVibratoObservations(technique),
      ...this.generateAttackObservations(technique),
      ...this.generateTransitionObservations(technique),
      ...this.generateResonanceObservations(technique),
      ...this.generateRhythmObservations(technique),
    ]
    return observations
  }

  private prioritizeObservations(observations: Observation[]): Observation[] {
    const sorted = observations.sort((a, b) => {
      const scoreA = a.severity * a.confidence
      const scoreB = b.severity * b.confidence
      return scoreB - scoreA
    })
    const limited = sorted.slice(0, 3)

    return limited
  }

  private calculateStability(frames: PitchedFrame[]): PitchStability {
    const noFrames = frames.length === 0
    if (noFrames) return this.createEmptyStability()

    return this.computeStabilityMetrics(frames)
  }

  private computeStabilityMetrics(frames: PitchedFrame[]): PitchStability {
    const globalStd = this.calculateStdDev(frames.map((f) => f.cents)) as Cents
    const settlingStd = this.calculateSettlingStd(frames) as Cents
    const { slope: drift } = this.performLinearRegression(frames)
    const inTuneRatio = this.calculateInTuneRatio(frames)

    const stability: PitchStability = {
      settlingStdCents: settlingStd,
      globalStdCents: globalStd,
      driftCentsPerSec: drift,
      inTuneRatio,
    }
    return stability
  }

  private calculateSettlingStd(frames: PitchedFrame[]): number {
    const startTime = frames[0].timestamp
    const settlingFrames = frames.filter(
      (f) => f.timestamp - startTime > this.options.settlingTimeMs,
    )
    const cents =
      settlingFrames.length > 0 ? settlingFrames.map((f) => f.cents) : frames.map((f) => f.cents)
    const stdDev = this.calculateStdDev(cents)

    return stdDev
  }

  private calculateInTuneRatio(frames: PitchedFrame[]): Ratio01 {
    const inTuneCount = frames.filter(
      (f) => Math.abs(f.cents) < this.options.inTuneThresholdCents,
    ).length
    const ratio = (inTuneCount / frames.length) as Ratio01

    return ratio
  }

  private createEmptyStability(): PitchStability {
    const zeroCents = 0 as Cents
    const zeroRatio = 0 as Ratio01
    const zeroDrift = 0

    return {
      settlingStdCents: zeroCents,
      globalStdCents: zeroCents,
      driftCentsPerSec: zeroDrift,
      inTuneRatio: zeroRatio,
    }
  }

  private calculateVibrato(frames: PitchedFrame[]): VibratoMetrics {
    const isCandidate = this.isVibratoCandidate(frames)
    if (!isCandidate) {
      return { present: false }
    }

    const metrics = this.computeVibratoMetrics(frames)
    const isValid = this.isVibratoValid(metrics)

    const result = this.assembleVibratoResult({ metrics, isValid })
    return result
  }

  private assembleVibratoResult(params: {
    metrics: { rateHz: Hz; widthCents: Cents; regularity: Ratio01 }
    isValid: boolean
  }): VibratoMetrics {
    const { metrics, isValid } = params
    return {
      present: isValid,
      rateHz: isValid ? metrics.rateHz : undefined,
      widthCents: isValid ? metrics.widthCents : undefined,
      regularity: isValid ? metrics.regularity : undefined,
    }
  }

  private computeVibratoMetrics(frames: PitchedFrame[]): {
    rateHz: Hz
    widthCents: Cents
    regularity: Ratio01
  } {
    const detrended = this.detrend(frames)
    const stdDev = this.calculateStdDev(detrended)
    const widthCents = (stdDev * 2.828) as Cents

    const analysis = this.executeVibratoAnalysis(detrended, frames)
    const rateHz = this.calculateVibratoRate(analysis.periodMs)
    const regularity = Math.max(0, analysis.correlation) as Ratio01

    return { rateHz, widthCents, regularity }
  }

  private executeVibratoAnalysis(detrended: number[], frames: PitchedFrame[]) {
    const timestamps = frames.map((f) => f.timestamp)
    const result = this.findPeriod(detrended, timestamps)
    const analysis = result

    return analysis
  }

  private calculateVibratoRate(periodMs: number): Hz {
    const isPositive = periodMs > 0
    const rate = isPositive ? 1000 / periodMs : 0
    const finalRate = rate as Hz

    return finalRate
  }

  private isVibratoCandidate(frames: PitchedFrame[]): boolean {
    if (frames.length < 20) return false
    const duration = frames[frames.length - 1].timestamp - frames[0].timestamp
    if (duration < 500) return false
    const pitchStd = this.calculateStdDev(frames.map((f) => f.cents))

    const isCandidate = pitchStd <= 40
    return isCandidate
  }

  private isVibratoValid(params: { rateHz: Hz; widthCents: Cents; regularity: Ratio01 }): boolean {
    const { rateHz, widthCents, regularity } = params

    const isRateMin = rateHz >= this.options.vibratoMinRateHz
    const isRateMax = rateHz <= this.options.vibratoMaxRateHz
    const isRateValid = isRateMin && isRateMax

    const isWidthValid = widthCents >= this.options.vibratoMinWidthCents
    const isRegValid = regularity >= this.options.vibratoMinRegularity

    const isValid = isRateValid && isWidthValid && isRegValid
    return isValid
  }

  private calculateAttackRelease(frames: ReadonlyArray<TechniqueFrame>): AttackReleaseMetrics {
    const noFrames = frames.length === 0
    if (noFrames) {
      return this.createEmptyAttackRelease()
    }

    const pitched = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')
    const result = this.executeAttackReleaseAnalysis(frames, pitched)

    return result
  }

  private executeAttackReleaseAnalysis(frames: ReadonlyArray<TechniqueFrame>, pitched: PitchedFrame[]) {
    const lastTime = frames[frames.length - 1].timestamp
    const attack = this.analyzeAttackPhase(frames, pitched)
    const release = this.analyzeReleasePhase(pitched, lastTime)

    return {
      attackTimeMs: attack.attackTimeMs,
      pitchScoopCents: attack.pitchScoopCents,
      releaseStability: release,
    }
  }

  private createEmptyAttackRelease(): AttackReleaseMetrics {
    const zeroMs = 0 as TimestampMs
    const zeroCents = 0 as Cents

    return {
      attackTimeMs: zeroMs,
      pitchScoopCents: zeroCents,
      releaseStability: zeroCents,
    }
  }

  private analyzeAttackPhase(
    frames: ReadonlyArray<TechniqueFrame>,
    pitchedFrames: PitchedFrame[],
  ): { attackTimeMs: TimestampMs; pitchScoopCents: Cents } {
    const startTime = frames[0].timestamp
    const attackTimeMs = this.calculateAttackTime(frames, startTime)
    const pitchScoopCents = this.calculatePitchScoop(pitchedFrames, startTime)

    return { attackTimeMs, pitchScoopCents }
  }

  private calculateAttackTime(
    frames: ReadonlyArray<TechniqueFrame>,
    startTime: TimestampMs,
  ): TimestampMs {
    const stableRmsThreshold = this.calculateStableRms(frames) * 0.85
    const stableFrame = frames.find((f) => f.rms >= stableRmsThreshold)
    const result = stableFrame ? ((stableFrame.timestamp - startTime) as TimestampMs) : (0 as TimestampMs)

    return result
  }

  private calculateStableRms(frames: ReadonlyArray<TechniqueFrame>): number {
    const startIdx = Math.floor(frames.length * 0.25)
    const endIdx = Math.floor(frames.length * 0.75)
    const middleFrames = frames.slice(startIdx, endIdx)

    if (middleFrames.length === 0) {
      return Math.max(...frames.map((f) => f.rms))
    }

    const rmsSum = middleFrames.reduce((sum, f) => sum + f.rms, 0)
    const avgRms = rmsSum / middleFrames.length

    return avgRms
  }

  private calculatePitchScoop(pitchedFrames: PitchedFrame[], startTime: TimestampMs): Cents {
    const early = pitchedFrames.filter((f) => f.timestamp - startTime <= 150)
    const stable = pitchedFrames.filter((f) => f.timestamp - startTime > this.options.settlingTimeMs)

    if (early.length === 0 || stable.length === 0) {
      return 0 as Cents
    }

    const avgEarly = early.reduce((sum, f) => sum + f.cents, 0) / early.length
    const avgStable = stable.reduce((sum, f) => sum + f.cents, 0) / stable.length
    const scoop = (avgEarly - avgStable) as Cents

    return scoop
  }

  private analyzeReleasePhase(pitchedFrames: PitchedFrame[], endTime: TimestampMs): Cents {
    const latePitched = pitchedFrames.filter((f) => endTime - f.timestamp <= 100)
    const stdDev = latePitched.length > 0
      ? (this.calculateStdDev(latePitched.map((f) => f.cents)) as Cents)
      : (0 as Cents)

    return stdDev
  }

  private calculateResonance(frames: PitchedFrame[]): ResonanceMetrics {
    const isTooSmall = frames.length < 10
    if (isTooSmall) return this.createEmptyResonance()

    return this.computeResonanceMetrics(frames)
  }

  private computeResonanceMetrics(frames: PitchedFrame[]): ResonanceMetrics {
    const lowConfRatio = this.calculateLowConfRatio(frames)
    const rmsBeatingScore = this.calculateRmsBeatingScore(frames)
    const pitchChaosScore = this.calculateStdDev(this.detrend(frames))

    const suspectedWolf = this.detectWolfTone({ lowConfRatio, rmsBeatingScore, pitchChaosScore })

    return {
      suspectedWolf,
      rmsBeatingScore,
      pitchChaosScore,
      lowConfRatio,
    }
  }

  private createEmptyResonance(): ResonanceMetrics {
    const defaultRatio = 0 as Ratio01
    const defaultChaos = 0
    const defaultWolf = false

    return {
      suspectedWolf: defaultWolf,
      rmsBeatingScore: defaultRatio,
      pitchChaosScore: defaultChaos,
      lowConfRatio: defaultRatio,
    }
  }

  private calculateLowConfRatio(frames: PitchedFrame[]): Ratio01 {
    const highRmsFrames = frames.filter((f) => f.rms > 0.02)
    const hasSamples = highRmsFrames.length > 0

    if (!hasSamples) {
      return 0 as Ratio01
    }

    const lowConfCount = highRmsFrames.filter((f) => f.confidence < 0.6).length
    const ratio = (lowConfCount / highRmsFrames.length) as Ratio01

    return ratio
  }

  private calculateRmsBeatingScore(frames: PitchedFrame[]): Ratio01 {
    const rmsValues = frames.map((f) => f.rms)
    const meanRms = rmsValues.reduce((a, b) => a + b) / rmsValues.length
    const detrendedRms = rmsValues.map((v) => v - meanRms)

    const analysis = this.findPeriod(detrendedRms, frames.map((f) => f.timestamp))
    const score = Math.max(0, analysis.correlation) as Ratio01

    return score
  }

  private detectWolfTone(params: {
    lowConfRatio: number
    rmsBeatingScore: number
    pitchChaosScore: number
  }): boolean {
    const { lowConfRatio, rmsBeatingScore, pitchChaosScore } = params
    const isConfInstability = lowConfRatio > 0.3 && rmsBeatingScore > 0.4
    const isChaosInstability = rmsBeatingScore > 0.6 && pitchChaosScore > 20

    const isWolf = isConfInstability || isChaosInstability
    return isWolf
  }

  private calculateRhythm(segment: NoteSegment): RhythmMetrics {
    const hasExpectedStart = segment.expectedStartTime !== undefined
    const onsetErrorMs = hasExpectedStart ? segment.startTime - (segment.expectedStartTime as number) : 0

    const hasExpectedDur = segment.expectedDuration !== undefined
    const durationErrorMs = hasExpectedDur
        ? segment.endTime - segment.startTime - (segment.expectedDuration as number)
        : undefined

    return { onsetErrorMs, durationErrorMs }
  }

  private calculateTransition(params: {
    gapFrames: ReadonlyArray<TechniqueFrame>
    currentFrames: ReadonlyArray<TechniqueFrame>
    prevSegment: NoteSegment | undefined
  }): TransitionMetrics {
    const { gapFrames, currentFrames } = params
    const timeMs = this.calculateTransitionTime(gapFrames)
    const glissCents = this.calculateGlissAmount(gapFrames)
    const landingCents = this.calculateLandingErrorMetric(currentFrames)
    const corrections = this.calculateCorrectionMetric(currentFrames)

    return {
      transitionTimeMs: timeMs,
      glissAmountCents: glissCents,
      landingErrorCents: landingCents,
      correctionCount: corrections,
    }
  }

  private calculateTransitionTime(gapFrames: ReadonlyArray<TechniqueFrame>): TimestampMs {
    if (gapFrames.length < 2) {
      return 0 as TimestampMs
    }

    const start = gapFrames[0].timestamp
    const end = gapFrames[gapFrames.length - 1].timestamp
    const duration = (end - start) as TimestampMs

    return duration
  }

  private calculateGlissAmount(gapFrames: ReadonlyArray<TechniqueFrame>): Cents {
    const pitchedGap = gapFrames.filter((f): f is PitchedFrame => {
      return f.kind === 'pitched'
    })
    const gliss = this.calculateGlissando(pitchedGap)
    const amount = gliss as Cents

    return amount
  }

  private calculateLandingErrorMetric(currentFrames: ReadonlyArray<TechniqueFrame>): Cents {
    const pitchedCurrent = currentFrames.filter((f): f is PitchedFrame => {
      return f.kind === 'pitched'
    })
    const start = currentFrames[0]?.timestamp ?? (0 as TimestampMs)
    const error = this.calculateLandingError(pitchedCurrent, start)

    return error as Cents
  }

  private calculateCorrectionMetric(currentFrames: ReadonlyArray<TechniqueFrame>): number {
    const pitchedCurrent = currentFrames.filter((f): f is PitchedFrame => {
      return f.kind === 'pitched'
    })
    const start = currentFrames[0]?.timestamp ?? (0 as TimestampMs)
    const count = this.calculateCorrectionCount(pitchedCurrent, start)

    return count
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
    const error = firstStable ? Math.abs(firstStable.cents) : 0

    return error
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

    const observation: Observation = {
      type: 'stability',
      severity: 2,
      confidence: 0.9 as Ratio01,
      message: drift > 0 ? 'Pitch is drifting sharp' : 'Pitch is drifting flat',
      tip: 'Maintain consistent finger pressure and bow speed.',
      evidence: { drift },
    }
    return [observation]
  }

  private generateVibratoObservations(technique: NoteTechnique): Observation[] {
    const { present, rateHz, widthCents, regularity } = technique.vibrato
    const hasFullMetrics =
      present && rateHz !== undefined && widthCents !== undefined && regularity !== undefined

    if (hasFullMetrics) {
      return this.analyzePresentVibrato(rateHz, widthCents)
    }

    return this.analyzeInconsistentVibrato(technique.vibrato)
  }

  private analyzePresentVibrato(rateHz: number, widthCents: number): Observation[] {
    const slow = this.checkSlowVibrato(rateHz)
    if (slow.length > 0) {
      return slow
    }

    const wide = this.checkWideVibrato(widthCents)
    if (wide.length > 0) {
      return wide
    }

    return []
  }

  private checkSlowVibrato(rateHz: number): Observation[] {
    const isSlow = rateHz < 4.5
    if (!isSlow) {
      return []
    }

    const observation = this.assembleSlowVibratoObservation(rateHz)
    const result = [observation]

    return result
  }

  private assembleSlowVibratoObservation(rateHz: number): Observation {
    return {
      type: 'vibrato',
      severity: 1,
      confidence: 0.8 as Ratio01,
      message: 'Slow vibrato detected',
      tip: 'Try to slightly increase the speed of your hand oscillation.',
      evidence: { rate: rateHz },
    }
  }

  private checkWideVibrato(widthCents: number): Observation[] {
    const isWide = widthCents > 35
    if (!isWide) {
      return []
    }

    const observation = this.assembleWideVibratoObservation(widthCents)
    const result = [observation]

    return result
  }

  private assembleWideVibratoObservation(widthCents: number): Observation {
    return {
      type: 'vibrato',
      severity: 1,
      confidence: 0.8 as Ratio01,
      message: 'Wide vibrato detected',
      tip: 'Focus on a narrower, more controlled oscillation.',
      evidence: { width: widthCents },
    }
  }

  private analyzeInconsistentVibrato(vibrato: VibratoMetrics): Observation[] {
    const width = vibrato.widthCents ?? 0
    const reg = vibrato.regularity ?? 0
    const isCandidate = this.isCandidateForInconsistency(width, reg)

    if (!isCandidate) {
      return []
    }

    const observation = this.assembleInconsistentVibratoObservation(reg)
    const result = [observation]

    return result
  }

  private isCandidateForInconsistency(width: number, reg: number): boolean {
    const isWideEnough = width > 10
    const isInconsistent = reg < 0.4
    const result = isWideEnough && isInconsistent

    return result
  }

  private assembleInconsistentVibratoObservation(reg: number): Observation {
    return {
      type: 'vibrato',
      severity: 2,
      confidence: 0.7 as Ratio01,
      message: 'Inconsistent vibrato',
      tip: 'Focus on a regular, relaxed movement of the wrist or arm.',
      evidence: { regularity: reg },
    }
  }

  private generateAttackObservations(technique: NoteTechnique): Observation[] {
    const slow = this.analyzeSlowAttack(technique.attackRelease.attackTimeMs)
    const scoop = this.analyzePitchScoop(technique.attackRelease.pitchScoopCents)
    const observations = [...slow, ...scoop]

    return observations
  }

  private analyzeSlowAttack(attackTimeMs: TimestampMs): Observation[] {
    if (attackTimeMs <= 200) return []
    const observation: Observation = {
      type: 'attack',
      severity: 1,
      confidence: 0.9 as Ratio01,
      message: 'Slow note attack',
      tip: 'Start the note with more clarity and deliberate bow contact.',
      evidence: { attackTime: attackTimeMs },
    }
    return [observation]
  }

  private analyzePitchScoop(pitchScoopCents: Cents): Observation[] {
    if (Math.abs(pitchScoopCents) <= 15) return []
    const message = pitchScoopCents < 0 ? 'Pitch scoops up' : 'Pitch drops down'
    const observation: Observation = {
      type: 'attack',
      severity: 2,
      confidence: 0.85 as Ratio01,
      message,
      tip: 'Ensure your finger is accurately placed before starting the bow.',
      evidence: { scoop: pitchScoopCents },
    }
    return [observation]
  }

  private generateTransitionObservations(technique: NoteTechnique): Observation[] {
    const gliss = this.analyzeAudibleGlissando(technique.transition)
    const landing = this.analyzeLandingError(technique.transition.landingErrorCents)
    const observations = [...gliss, ...landing]

    return observations
  }

  private analyzeAudibleGlissando(transition: TransitionMetrics): Observation[] {
    const isGlissStrong = transition.glissAmountCents > 50
    const isTransitionSlow = transition.transitionTimeMs > 120
    const isSignificant = isGlissStrong && isTransitionSlow

    if (!isSignificant) {
      return []
    }

    const observation = this.assembleGlissandoObservation(transition)
    return [observation]
  }

  private assembleGlissandoObservation(transition: TransitionMetrics): Observation {
    const gliss = transition.glissAmountCents
    const time = transition.transitionTimeMs

    return {
      type: 'transition',
      severity: 2,
      confidence: 0.8 as Ratio01,
      message: 'Audible glissando',
      tip: 'Move your hand more quickly between positions for a cleaner transition.',
      evidence: { gliss, time },
    }
  }

  private analyzeLandingError(landingErrorCents: Cents): Observation[] {
    if (landingErrorCents <= 20) return []
    const observation: Observation = {
      type: 'transition',
      severity: 2,
      confidence: 0.75 as Ratio01,
      message: 'Landing error',
      tip: 'Aim for the center of the new note immediately upon shifting.',
      evidence: { error: landingErrorCents },
    }
    return [observation]
  }

  private generateResonanceObservations(technique: NoteTechnique): Observation[] {
    const suspectedWolf = technique.resonance.suspectedWolf
    if (!suspectedWolf) {
      return []
    }

    const observation = this.assembleResonanceObservation(technique.resonance)
    const result = [observation]

    return result
  }

  private assembleResonanceObservation(resonance: ResonanceMetrics): Observation {
    const beating = resonance.rmsBeatingScore
    const chaos = resonance.pitchChaosScore

    return {
      type: 'resonance',
      severity: 3,
      confidence: 0.6 as Ratio01,
      message: 'Tone instability (Wolf-like resonance)',
      tip: 'Adjust your bow pressure, speed, or contact point to stabilize the tone.',
      evidence: { beating, chaos },
    }
  }

  private generateRhythmObservations(technique: NoteTechnique): Observation[] {
    const error = technique.rhythm.onsetErrorMs
    if (Math.abs(error) <= 60) return []

    const message = error > 0 ? 'Late note entry' : 'Early note entry'
    const observation: Observation = {
      type: 'rhythm',
      severity: 2,
      confidence: 0.95 as Ratio01,
      message,
      tip: 'Focus on the internal beat and prepare your fingers in advance.',
      evidence: { error },
    }
    return [observation]
  }

  private calculateStdDev(values: number[]): number {
    const size = values.length
    if (size === 0) return 0

    const sum = values.reduce((acc, v) => acc + v, 0)
    const mean = sum / size
    const deviations = values.map((v) => (v - mean) ** 2)
    const varianceSum = deviations.reduce((acc, v) => acc + v, 0)
    const averageVariance = varianceSum / size
    const stdDev = Math.sqrt(averageVariance)

    return stdDev
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
    return frames.reduce(
      (acc, f) => {
        const x = (f.timestamp - startTime) / 1000
        const y = f.cents
        return {
          sumX: acc.sumX + x,
          sumY: acc.sumY + y,
          sumXY: acc.sumXY + x * y,
          sumXX: acc.sumXX + x * x,
        }
      },
      { sumX: 0, sumY: 0, sumXY: 0, sumXX: 0 },
    )
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
    const delta = timestamps[timestamps.length - 1] - timestamps[0]
    const avgDt = delta / (timestamps.length - 1)
    if (avgDt <= 0) return { periodMs: 0, correlation: 0 }

    let best = { correlation: -1, periodMs: 0 }
    for (let periodMs = 100; periodMs <= 250; periodMs += 2) {
      const result = this.evaluatePeriod({ values, periodMs, avgDt })
      if (result.correlation > best.correlation) {
        best = result
      }
    }
    return best
  }

  private evaluatePeriod(params: { values: number[]; periodMs: number; avgDt: number }) {
    const { values, periodMs, avgDt } = params
    const lag = Math.round(periodMs / avgDt)
    if (lag >= values.length * 0.8 || lag <= 1) {
      return { correlation: -1, periodMs }
    }
    const correlation = this.calculateAutocorrelation(values, lag)
    return { correlation, periodMs }
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
