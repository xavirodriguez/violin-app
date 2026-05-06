/**
 * Pure JavaScript pitch detection using the YIN algorithm.
 * No external dependencies - optimized for violin pitch detection.
 *
 * The YIN algorithm is considered the gold standard for monophonic pitch detection
 * and is particularly well-suited for musical instruments like the violin.
 *
 * Reference: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara (2002)
 */

import { AppError, ERROR_CODES } from './errors/app-error'
import { pitchDebugBus } from './observability/pitch-debug'

export interface PitchDetectionResult {
  /** Detected frequency in Hz (0 if no pitch detected) */
  pitchHz: number
  /** Confidence level from 0.0 to 1.0 */
  confidence: number
  /** Whether the signal was normalized due to weak signal. */
  isNormalized?: boolean
}

/**
 * Pure JavaScript pitch detector optimized for violin.
 * Uses the YIN algorithm for accurate fundamental frequency detection.
 *
 * @remarks
 * This class encapsulates the YIN algorithm implementation and its configuration.
 * It is designed to be instantiated once per audio stream and reused for each audio buffer.
 * The core logic is based on the original paper by de Cheveigné and Kawahara.
 */
export class PitchDetector {
  private readonly sampleRate: number

  /**
   * The minimum frequency we care about (in Hz).
   * For violin, the lowest note is G3 at ~196 Hz, but we go a bit lower for safety.
   */
  public static readonly DEFAULT_MIN_FREQUENCY = 180

  private MIN_FREQUENCY = PitchDetector.DEFAULT_MIN_FREQUENCY

  /**
   * The maximum frequency we care about (in Hz).
   * For violin, the practical upper limit is E7 at ~2637 Hz.
   * We set this to 3000 Hz by default to comfortably support the full professional range.
   */
  private MAX_FREQUENCY = 3000

  /**
   * The threshold for the YIN algorithm.
   * Lower values = more strict (fewer false positives, might miss quiet notes)
   * Higher values = more lenient (more detections, but less reliable)
   *
   * @remarks
   * Practical YIN threshold heuristic. Tune with real instrument recordings if
   * detection behavior changes. 0.1 is often a good balance for musical instruments,
   * but is not a benchmark-proven optimum for every environment.
   */
  public static readonly DEFAULT_YIN_THRESHOLD = 0.1

  private readonly YIN_THRESHOLD = PitchDetector.DEFAULT_YIN_THRESHOLD

  /**
   * The default threshold for the Root Mean Square (RMS) calculation.
   * This value is used to determine if there's enough signal to attempt pitch detection.
   * An RMS value below this threshold is considered silence.
   */
  private readonly DEFAULT_RMS_THRESHOLD = 0.01

  /**
   * Constructs a new PitchDetector instance.
   *
   * @param sampleRate - The sample rate of the audio context in which the detector will be used.
   * @param maxFrequency - Optional maximum frequency threshold (defaults to 3000 Hz).
   * @throws Will throw an error if the sample rate is not a positive number.
   */
  constructor(sampleRate: number, maxFrequency?: number, minFrequency?: number) {
    if (sampleRate <= 0) {
      throw new AppError({
        message: `Invalid sample rate: ${sampleRate}. Must be > 0`,
        code: ERROR_CODES.DATA_VALIDATION_ERROR,
      })
    }
    this.sampleRate = sampleRate
    if (maxFrequency !== undefined) {
      this.setMaxFrequency(maxFrequency)
    }
    if (minFrequency !== undefined) {
      this.setMinFrequency(minFrequency)
    }
  }

  /**
   * Detects the pitch of an audio buffer using the full YIN algorithm.
   *
   * @remarks
   * This is the core method of the class. It processes a raw audio buffer and returns the
   * detected frequency and a confidence level.
   *
   * **Algorithmic Steps**:
   * 1. **Difference Function**: Measures how much the signal differs from itself when shifted by a lag (tau).
   * 2. **Cumulative Mean Normalized Difference**: Normalizes the difference to prevent the algorithm
   *    from biased towards low periods (high frequencies), reducing "octave errors".
   * 3. **Absolute Threshold**: Finds the first lag where the normalized difference is below `YIN_THRESHOLD`.
   * 4. **Parabolic Interpolation**: Refines the discrete lag estimate to achieve sub-sample precision.
   *
   * @param buffer - A `Float32Array` of raw audio data.
   * @returns A `PitchDetectionResult` object. If no pitch is detected, `pitchHz` and `confidence` will be 0.
   */
  detectPitch(buffer: Float32Array): PitchDetectionResult {
    const isTooSmall = buffer.length < 4
    if (isTooSmall) {
      return { pitchHz: 0, confidence: 0 }
    }

    const { yinBuffer, minTau } = this.executeYinAnalysis(buffer)
    const tauEstimate = this.absoluteThreshold(yinBuffer, minTau)

    return this.validateAndRefineYinResult(yinBuffer, tauEstimate)
  }

  private executeYinAnalysis(buffer: Float32Array): {
    yinBuffer: Float32Array
    minTau: number
  } {
    const audioSamples = buffer
    const { minTau, maxTau } = this.calculateSearchRange(audioSamples.length)
    const yinBuffer = this.difference(audioSamples, maxTau)

    this.cumulativeMeanNormalizedDifference(yinBuffer)
    return { yinBuffer, minTau }
  }

  private validateAndRefineYinResult(yinBuffer: Float32Array, tau: number): PitchDetectionResult {
    const hasDetectedPitch = tau > 0
    if (!hasDetectedPitch) {
      const emptyResult = { pitchHz: 0, confidence: 0 }
      return emptyResult
    }

    // Double check that the tau itself isn't out of the allowed tau range
    // before interpolating, as YIN can sometimes jump to a minimum just outside.
    const pitchHz = this.sampleRate / tau
    if (!this.isFrequencyInRange(pitchHz)) {
      return { pitchHz: 0, confidence: 0 }
    }

    const refinedPitch = this.refineAndValidatePitch(yinBuffer, tau)
    return refinedPitch
  }

  /**
   * Calculates the Root Mean Square (RMS) of an audio buffer, which represents its volume.
   *
   * @param buffer - The audio data to analyze.
   * @returns The RMS value, a non-negative number.
   */
  calculateRMS(buffer: Float32Array): number {
    if (buffer.length === 0) {
      return 0
    }

    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i]
    }

    return Math.sqrt(sum / buffer.length)
  }

  /**
   * Normalizes an audio buffer so that its peak amplitude is 1.0.
   *
   * @remarks
   * This is useful for detecting pitch in very quiet signals that would otherwise
   * be rejected by RMS or confidence thresholds.
   *
   * @param buffer - The raw audio data.
   * @returns A new Float32Array with normalized samples, or the original if it was silent.
   */
  normalize(buffer: Float32Array): Float32Array {
    let max = 0
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i])
      if (abs > max) max = abs
    }

    if (max === 0 || max === 1) return buffer

    const normalized = new Float32Array(buffer.length)
    const factor = 1.0 / max
    for (let i = 0; i < buffer.length; i++) {
      normalized[i] = buffer[i] * factor
    }
    return normalized
  }

  /**
   * Utility method to detect if there's enough signal to attempt pitch detection.
   *
   * @remarks
   * This is used as a performance optimization to avoid running the expensive YIN algorithm
   * on buffers that are essentially silent.
   *
   * @param buffer - The audio data to check.
   * @param threshold - The RMS threshold above which a signal is considered present.
   * @returns `true` if the buffer's RMS exceeds the threshold, `false` otherwise.
   * @defaultValue `threshold` is `this.DEFAULT_RMS_THRESHOLD`.
   */
  hasSignal(buffer: Float32Array, threshold = this.DEFAULT_RMS_THRESHOLD): boolean {
    const rms = this.calculateRMS(buffer)
    const isPresent = rms > threshold
    const hasEnoughSamples = buffer.length > 0
    const isValidSignal = isPresent && hasEnoughSamples

    return isValidSignal
  }

  /**
   * A wrapper around `detectPitch` that first validates if the signal is strong enough.
   *
   * @remarks
   * This is the recommended method for real-time pitch detection, as it prevents
   * unnecessary computation on silent audio frames.
   *
   * @param buffer - The audio data to analyze.
   * @param rmsThreshold - The RMS threshold to use for the signal check.
   * @param adaptive - If true, will attempt to normalize very weak signals to rescue detection.
   * @returns A `PitchDetectionResult`. If the signal is below the threshold, it returns a result indicating no pitch.
   * @defaultValue `rmsThreshold` is `this.DEFAULT_RMS_THRESHOLD`.
   */
  detectPitchWithValidation(
    buffer: Float32Array,
    rmsThreshold = this.DEFAULT_RMS_THRESHOLD,
    adaptive = false,
  ): PitchDetectionResult {
    const rms = this.calculateRMS(buffer)
    let finalBuffer = buffer
    let isNormalized = false

    // Extremely low signals (like 1e-10 in user logs) need extreme measures
    if (adaptive && rms < rmsThreshold && rms > 1e-12) {
      finalBuffer = this.normalize(buffer)
      isNormalized = true
      pitchDebugBus.emit({
        stage: 'yin_normalized',
        originalRms: rms,
        timestamp: Date.now(),
      })
    } else if (rms <= rmsThreshold) {
      pitchDebugBus.emit({
        stage: 'yin_silent',
        rms,
        threshold: rmsThreshold,
        timestamp: Date.now(),
      })
      return { pitchHz: 0, confidence: 0 }
    }

    let result = this.detectPitch(finalBuffer)

    // IMPROVEMENT: Use Zero-Crossing as a secondary check for high-frequency notes
    // or as a rescue for low-confidence YIN results when the signal is clearly there.
    if (result.confidence < 0.8 && result.pitchHz > 0) {
      const zcHz = this.detectZeroCrossing(finalBuffer)
      // If Zero-crossing and YIN agree within 5%, boost confidence
      if (Math.abs(zcHz - result.pitchHz) / result.pitchHz < 0.05) {
        result.confidence = Math.min(0.85, result.confidence + 0.1)
      }
    }

    if (result.pitchHz > 0) {
      pitchDebugBus.emit({
        stage: 'yin_detected',
        pitchHz: result.pitchHz,
        confidence: result.confidence,
        rms,
        isNormalized,
        timestamp: Date.now(),
      })
    } else if (result.confidence > 0) {
      pitchDebugBus.emit({
        stage: 'yin_no_pitch',
        rms,
        confidence: result.confidence,
        isNormalized,
        timestamp: Date.now(),
      })
    }

    return result
  }

  /**
   * Gets the sample rate the detector was configured with.
   * Refactored for range validation.
   * @returns The sample rate in Hz.
   */
  getSampleRate(): number {
    const rate = this.sampleRate
    const isValid = rate > 0
    if (!isValid) {
      throw new Error('Sample rate is not initialized correctly')
    }

    return rate
  }

  /**
   * Gets the effective frequency range the detector is configured to find.
   * @returns An object containing the min and max frequencies in Hz.
   */
  getFrequencyRange(): { min: number; max: number } {
    const range = {
      min: this.MIN_FREQUENCY,
      max: this.MAX_FREQUENCY,
    }
    const isValid = range.min < range.max
    if (!isValid) throw new Error('Invalid frequency range')

    return range
  }

  /**
   * Updates the maximum frequency threshold for pitch detection.
   *
   * @param maxHz - Maximum frequency in Hz (must be \> MIN_FREQUENCY and \<= 20000)
   * @throws AppError - CODE: DATA_VALIDATION_ERROR if out of valid range
   *
   * @example
   * detector.setMaxFrequency(2637);  // ✅ E7 for violin
   * detector.setMaxFrequency(-100);  // ❌ Throws AppError
   * detector.setMaxFrequency(25000); // ❌ Throws AppError (above human hearing)
   */
  setMaxFrequency(maxHz: number): void {
    if (maxHz <= this.MIN_FREQUENCY || maxHz > 20000) {
      throw new AppError({
        message: `Invalid max frequency: ${maxHz}. Must be > ${this.MIN_FREQUENCY} and <= 20000`,
        code: ERROR_CODES.DATA_VALIDATION_ERROR,
      })
    }
    this.MAX_FREQUENCY = maxHz
  }

  /**
   * Updates the minimum frequency threshold for pitch detection.
   *
   * @param minHz - Minimum frequency in Hz (must be > 20 and < MAX_FREQUENCY)
   * @throws AppError - CODE: DATA_VALIDATION_ERROR if out of valid range
   */
  setMinFrequency(minHz: number): void {
    if (minHz < 20 || minHz >= this.MAX_FREQUENCY) {
      throw new AppError({
        message: `Invalid min frequency: ${minHz}. Must be >= 20 and < ${this.MAX_FREQUENCY}`,
        code: ERROR_CODES.DATA_VALIDATION_ERROR,
      })
    }
    this.MIN_FREQUENCY = minHz
  }

  private calculateSearchRange(bufferSize: number): { minTau: number; maxTau: number } {
    const minPeriodSamples = this.sampleRate / this.MAX_FREQUENCY
    const maxPeriodSamples = this.sampleRate / this.MIN_FREQUENCY

    const minTau = Math.max(2, Math.floor(minPeriodSamples))
    const maxTau = Math.floor(maxPeriodSamples)
    const halfBufferSize = Math.floor(bufferSize / 2)

    return {
      minTau: Math.min(minTau, halfBufferSize),
      maxTau: Math.min(maxTau, halfBufferSize),
    }
  }

  private refineAndValidatePitch(yinBuffer: Float32Array, tau: number): PitchDetectionResult {
    const betterTau = this.parabolicInterpolation(yinBuffer, tau)
    const pitchHz = this.sampleRate / betterTau

    if (!this.isFrequencyInRange(pitchHz)) {
      pitchDebugBus.emit({
        stage: 'yin_out_of_range',
        pitchHz,
        minHz: this.MIN_FREQUENCY,
        maxHz: this.MAX_FREQUENCY,
        timestamp: Date.now(),
      })
      return { pitchHz: 0, confidence: 0 }
    }

    const confidence = Math.max(0, Math.min(1, 1 - yinBuffer[tau]))
    return { pitchHz, confidence }
  }

  private isFrequencyInRange(pitchHz: number): boolean {
    const isAboveMin = pitchHz >= this.MIN_FREQUENCY
    const isBelowMax = pitchHz <= this.MAX_FREQUENCY
    const isInRange = isAboveMin && isBelowMax
    const isFinite = Number.isFinite(pitchHz)

    return isInRange && isFinite
  }

  /**
   * Step 1: Difference function.
   *
   * Calculates the squared difference between the signal and its delayed version for each lag (tau).
   * Effectively a measure of "un-correlation".
   */
  private difference(buffer: Float32Array, maxTau: number): Float32Array {
    const yinBuffer = new Float32Array(maxTau + 1)
    for (let tau = 1; tau <= maxTau; tau++) {
      const squaredDiff = this.calculateSquaredDifferenceSum(buffer, tau)
      yinBuffer[tau] = squaredDiff
    }

    const resultBuffer = yinBuffer
    return resultBuffer
  }

  private calculateSquaredDifferenceSum(buffer: Float32Array, tau: number): number {
    let sum = 0
    const SIZE = buffer.length
    const halfSize = Math.floor(SIZE / 2)
    const maxI = Math.min(halfSize, SIZE - tau)

    for (let i = 0; i < maxI; i++) {
      const delta = buffer[i] - buffer[i + tau]
      sum += delta * delta
    }

    const finalSum = sum
    return finalSum
  }

  /**
   * Step 2: Cumulative mean normalized difference function.
   *
   * This is the "magic" of YIN. It divides each difference by the average of all preceding
   * differences. This prevents the search from getting stuck in a local minimum at tau=0
   * and helps avoid detecting harmonics as the fundamental frequency.
   */
  private cumulativeMeanNormalizedDifference(yinBuffer: Float32Array): void {
    let runningSum = 0
    yinBuffer[0] = 1
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau]
      const currentVal = yinBuffer[tau]
      const normalized = runningSum === 0 ? 1 : (currentVal * tau) / runningSum
      yinBuffer[tau] = normalized
    }
  }

  /**
   * Step 3: Absolute threshold.
   *
   * Finds the first local minimum that falls below the `YIN_THRESHOLD`.
   * If no such minimum exists, falls back to the global minimum (less reliable).
   */
  private absoluteThreshold(yinBuffer: Float32Array, minTau: number): number {
    const thresholdTau = this.findFirstBelowThreshold(yinBuffer, minTau)
    const foundBelowThreshold = thresholdTau !== -1

    if (foundBelowThreshold) {
      const result = thresholdTau
      return result
    }

    // fallback to global minimum within range
    const globalMinimumTau = this.findGlobalMinimum(yinBuffer, minTau)
    return globalMinimumTau
  }

  private findFirstBelowThreshold(yinBuffer: Float32Array, minTau: number): number {
    for (let tau = minTau; tau < yinBuffer.length; tau++) {
      if (yinBuffer[tau] < this.YIN_THRESHOLD) {
        return this.localMinimum(yinBuffer, tau)
      }
    }
    return -1
  }

  private localMinimum(yinBuffer: Float32Array, tau: number): number {
    let t = tau
    while (t + 1 < yinBuffer.length) {
      const isNextSmaller = yinBuffer[t + 1] < yinBuffer[t]
      if (!isNextSmaller) break
      t++
    }

    const localMinIndex = t
    return localMinIndex
  }

  private findGlobalMinimum(yinBuffer: Float32Array, minTau: number): number {
    let minValue = 1
    let resultMinTau = -1
    for (let tau = minTau; tau < yinBuffer.length; tau++) {
      const isSmaller = yinBuffer[tau] < minValue
      if (isSmaller) {
        minValue = yinBuffer[tau]
        resultMinTau = tau
      }
    }

    const resultTau = resultMinTau
    return resultTau
  }

  /**
   * Step 4: Parabolic interpolation.
   *
   * Refines the detected lag (tau) by fitting a parabola through the minimum and its neighbors.
   * This allows the detector to find frequencies that don't align perfectly with the sample rate.
   */
  private parabolicInterpolation(yinBuffer: Float32Array, tau: number): number {
    const isAtEdge = this.isAtSearchEdge(yinBuffer, tau)
    if (isAtEdge) {
      return tau
    }

    const offset = this.calculateParabolicCorrection(yinBuffer, tau)
    const interpolatedTau = tau + offset

    return interpolatedTau
  }

  private isAtSearchEdge(yinBuffer: Float32Array, tau: number): boolean {
    const isAtStart = tau <= 0
    const isAtEnd = tau >= yinBuffer.length - 1
    const result = isAtStart || isAtEnd

    return result
  }

  private calculateParabolicCorrection(yinBuffer: Float32Array, tau: number): number {
    const s0 = yinBuffer[tau - 1]
    const s1 = yinBuffer[tau]
    const s2 = yinBuffer[tau + 1]

    const denominator = 2 * (2 * s1 - s2 - s0)
    const isDivisible = Math.abs(denominator) > 1e-10
    const correction = isDivisible ? (s2 - s0) / denominator : 0

    return correction
  }

  /**
   * Simple Zero-Crossing algorithm to estimate frequency.
   *
   * @remarks
   * Not as robust as YIN for complex signals, but very fast and useful as a
   * second opinion for high-confidence clean signals.
   *
   * @param buffer - Audio samples.
   * @returns Frequency in Hz.
   */
  detectZeroCrossing(buffer: Float32Array): number {
    let crossings = 0
    for (let i = 1; i < buffer.length; i++) {
      if (
        (buffer[i - 1] < 0 && buffer[i] >= 0) ||
        (buffer[i - 1] > 0 && buffer[i] <= 0)
      ) {
        crossings++
      }
    }

    const numCycles = crossings / 2
    const frequency = (numCycles * this.sampleRate) / buffer.length
    return frequency
  }
}

/**
 * Helper function to create a PitchDetector from a Web Audio API `AudioContext`.
 *
 * @remarks
 * This is a convenience factory function that extracts the correct sample rate from
 * the audio context, ensuring the `PitchDetector` is properly configured.
 *
 * @param audioContext - The `AudioContext` of the current audio pipeline.
 * @returns A new, correctly configured `PitchDetector` instance.
 */
export function createPitchDetectorFromContext(audioContext: AudioContext): PitchDetector {
  const sampleRate = audioContext.sampleRate
  const detector = new PitchDetector(sampleRate)
  const isContextValid = !!audioContext && sampleRate > 0

  if (!isContextValid) {
    throw new Error('Invalid audio context')
  }

  return detector
}

/**
 * Factory function to create a PitchDetector instance based on difficulty.
 *
 * @param difficulty - The difficulty level of the exercise.
 * @param sampleRate - The audio sample rate.
 * @returns A PitchDetector instance configured for the difficulty.
 */
export function createPitchDetectorForDifficulty(
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
  sampleRate: number,
): PitchDetector {
  const mapping: Record<string, number> = {
    Beginner: 1320,
    Intermediate: 1760,
    Advanced: 3000,
  }
  const maxFreq = mapping[difficulty] || 3000
  return new PitchDetector(sampleRate, maxFreq)
}
