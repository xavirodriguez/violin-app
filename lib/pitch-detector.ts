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

export interface PitchDetectionResult {
  /** Detected frequency in Hz (0 if no pitch detected) */
  pitchHz: number
  /** Confidence level from 0.0 to 1.0 */
  confidence: number
}

/**
 * Pure JavaScript pitch detector optimized for violin.
 * Uses the YIN algorithm for accurate fundamental frequency detection.
 */
export class PitchDetector {
  private readonly sampleRate: number

  /**
   * The minimum frequency we care about (in Hz).
   * For violin, the lowest note is G3 at ~196 Hz, but we go a bit lower for safety.
   */
  private readonly MIN_FREQUENCY = 180

  /**
   * The maximum frequency we care about (in Hz).
   * For violin, the highest common note is around E7 at ~2637 Hz.
   * We set this to 700 Hz by default to focus on the practical range for beginners.
   */
  private MAX_FREQUENCY = 700

  /**
   * The threshold for the YIN algorithm.
   * Lower values = more strict (fewer false positives, might miss quiet notes)
   * Higher values = more lenient (more detections, but less reliable)
   * 0.1 is a good balance for musical instruments.
   */
  private readonly YIN_THRESHOLD = 0.1

  /**
   * The default threshold for the Root Mean Square (RMS) calculation.
   * This value is used to determine if there's enough signal to attempt pitch detection.
   * An RMS value below this threshold is considered silence.
   */
  private readonly DEFAULT_RMS_THRESHOLD = 0.01

  constructor(sampleRate: number) {
    if (sampleRate <= 0) {
      throw new Error(`Invalid sample rate: ${sampleRate}. Must be > 0`)
    }
    this.sampleRate = sampleRate
  }

  /**
   * Detects the pitch of an audio buffer using the YIN algorithm.
   */
  detectPitch(buffer: Float32Array): PitchDetectionResult {
    const SIZE = buffer.length
    if (SIZE < 4) return { pitchHz: 0, confidence: 0 }

    const maxTau = Math.floor(this.sampleRate / this.MIN_FREQUENCY)
    const searchSize = Math.min(maxTau, Math.floor(SIZE / 2))

    const yinBuffer = this.difference(buffer, searchSize)
    this.cumulativeMeanNormalizedDifference(yinBuffer)
    const tauEstimate = this.absoluteThreshold(yinBuffer)

    if (tauEstimate <= 0) return { pitchHz: 0, confidence: 0 }

    const betterTau = this.parabolicInterpolation(yinBuffer, tauEstimate)
    const pitchHz = this.sampleRate / betterTau

    if (pitchHz < this.MIN_FREQUENCY || pitchHz > this.MAX_FREQUENCY) {
      return { pitchHz: 0, confidence: 0 }
    }

    const confidence = Math.max(0, Math.min(1, 1 - yinBuffer[tauEstimate]))
    return { pitchHz, confidence }
  }

  /** Step 1: Difference function */
  private difference(buffer: Float32Array, searchSize: number): Float32Array {
    const yinBuffer = new Float32Array(searchSize)
    const SIZE = buffer.length
    const halfSize = Math.floor(SIZE / 2)

    for (let tau = 1; tau < searchSize; tau++) {
      let sum = 0
      const maxI = Math.min(halfSize, SIZE - tau)
      for (let i = 0; i < maxI; i++) {
        const delta = buffer[i] - buffer[i + tau]
        sum += delta * delta
      }
      yinBuffer[tau] = sum
    }
    return yinBuffer
  }

  /** Step 2: Cumulative mean normalized difference function */
  private cumulativeMeanNormalizedDifference(yinBuffer: Float32Array): void {
    let runningSum = 0
    yinBuffer[0] = 1
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau]
      yinBuffer[tau] = runningSum === 0 ? 1 : (yinBuffer[tau] * tau) / runningSum
    }
  }

  /** Step 3: Absolute threshold */
  private absoluteThreshold(yinBuffer: Float32Array): number {
    const size = yinBuffer.length
    for (let tau = 2; tau < size; tau++) {
      if (yinBuffer[tau] < this.YIN_THRESHOLD) {
        let t = tau
        while (t + 1 < size && yinBuffer[t + 1] < yinBuffer[t]) {
          t++
        }
        return t
      }
    }

    // Fallback: find global minimum
    let minValue = 1
    let minTau = -1
    for (let tau = 2; tau < size; tau++) {
      if (yinBuffer[tau] < minValue) {
        minValue = yinBuffer[tau]
        minTau = tau
      }
    }
    return minTau
  }

  /** Step 4: Parabolic interpolation */
  private parabolicInterpolation(yinBuffer: Float32Array, tau: number): number {
    if (tau <= 0 || tau >= yinBuffer.length - 1) return tau

    const s0 = yinBuffer[tau - 1]
    const s1 = yinBuffer[tau]
    const s2 = yinBuffer[tau + 1]

    const denominator = 2 * (2 * s1 - s2 - s0)
    if (Math.abs(denominator) > 1e-10) {
      return tau + (s2 - s0) / denominator
    }
    return tau
  }

  /**
   * Calculates the Root Mean Square (RMS) of an audio buffer.
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
   * Utility method to detect if there's enough signal to attempt pitch detection.
   */
  hasSignal(buffer: Float32Array, threshold = this.DEFAULT_RMS_THRESHOLD): boolean {
    return this.calculateRMS(buffer) > threshold
  }

  /**
   * Advanced pitch detection with built-in signal validation.
   */
  detectPitchWithValidation(
    buffer: Float32Array,
    rmsThreshold = this.DEFAULT_RMS_THRESHOLD,
  ): PitchDetectionResult {
    if (!this.hasSignal(buffer, rmsThreshold)) {
      return { pitchHz: 0, confidence: 0 }
    }

    return this.detectPitch(buffer)
  }

  getSampleRate(): number {
    return this.sampleRate
  }

  getFrequencyRange(): { min: number; max: number } {
    return {
      min: this.MIN_FREQUENCY,
      max: this.MAX_FREQUENCY,
    }
  }

  /**
   * Updates the maximum frequency threshold for pitch detection.
   * Higher values allow detecting notes in higher positions (e.g., E7 ~2637 Hz).
   */
  setMaxFrequency(maxHz: number): void {
    if (maxHz <= this.MIN_FREQUENCY) {
      throw new Error(`Max frequency must be greater than min frequency (${this.MIN_FREQUENCY} Hz)`)
    }
    this.MAX_FREQUENCY = maxHz
  }
}

/**
 * Helper function to create a PitchDetector from an AudioContext.
 */
export function createPitchDetectorFromContext(audioContext: AudioContext): PitchDetector {
  return new PitchDetector(audioContext.sampleRate)
}
