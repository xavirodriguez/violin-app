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
  private readonly MIN_FREQUENCY = 180

  /**
   * The maximum frequency we care about (in Hz).
   * For violin, the highest common note is around E7 at ~2637 Hz.
   * We set this to 700 Hz to focus on the practical range for beginners.
   */
  private readonly MAX_FREQUENCY = 700

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

  /**
   * Constructs a new PitchDetector instance.
   *
   * @param sampleRate - The sample rate of the audio context in which the detector will be used.
   * @throws Will throw an error if the sample rate is not a positive number.
   */
  constructor(sampleRate: number) {
    if (sampleRate <= 0) {
      throw new Error(`Invalid sample rate: ${sampleRate}. Must be > 0`)
    }
    this.sampleRate = sampleRate
  }

  /**
   * Detects the pitch of an audio buffer using the full YIN algorithm.
   *
   * @remarks
   * This is the core method of the class. It processes a raw audio buffer and returns the
   * detected frequency and a confidence level. For performance, it's recommended to use
   * `detectPitchWithValidation` to avoid running the algorithm on silent buffers.
   *
   * @param buffer - A `Float32Array` of raw audio data.
   * @returns A `PitchDetectionResult` object. If no pitch is detected, `pitchHz` and `confidence` will be 0.
   */
  detectPitch(buffer: Float32Array): PitchDetectionResult {
    const SIZE = buffer.length

    // Early return for invalid buffers
    if (SIZE < 4) {
      return { pitchHz: 0, confidence: 0 }
    }

    // Calculate the maximum lag (tau) we need to check
    const maxTau = Math.floor(this.sampleRate / this.MIN_FREQUENCY)
    const halfSize = Math.floor(SIZE / 2)
    const searchSize = Math.min(maxTau, halfSize)

    // Step 1: Difference function
    const yinBuffer = new Float32Array(searchSize)
    yinBuffer[0] = 1

    for (let tau = 1; tau < searchSize; tau++) {
      let sum = 0
      const maxI = Math.min(halfSize, SIZE - tau)

      for (let i = 0; i < maxI; i++) {
        const delta = buffer[i] - buffer[i + tau]
        sum += delta * delta
      }

      yinBuffer[tau] = sum
    }

    // Step 2: Cumulative mean normalized difference function
    let runningSum = 0
    yinBuffer[0] = 1

    for (let tau = 1; tau < searchSize; tau++) {
      runningSum += yinBuffer[tau]

      if (runningSum === 0) {
        yinBuffer[tau] = 1
      } else {
        yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum
      }
    }

    // Step 3: Absolute threshold
    let tauEstimate = -1

    for (let tau = 2; tau < searchSize; tau++) {
      if (yinBuffer[tau] < this.YIN_THRESHOLD) {
        while (tau + 1 < searchSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++
        }
        tauEstimate = tau
        break
      }
    }

    if (tauEstimate === -1) {
      let minValue = 1
      let minTau = -1

      for (let tau = 2; tau < searchSize; tau++) {
        if (yinBuffer[tau] < minValue) {
          minValue = yinBuffer[tau]
          minTau = tau
        }
      }

      tauEstimate = minTau
    }

    if (tauEstimate === -1 || tauEstimate === 0) {
      return { pitchHz: 0, confidence: 0 }
    }

    // Step 4: Parabolic interpolation
    let betterTau = tauEstimate

    if (tauEstimate > 0 && tauEstimate < searchSize - 1) {
      const s0 = yinBuffer[tauEstimate - 1]
      const s1 = yinBuffer[tauEstimate]
      const s2 = yinBuffer[tauEstimate + 1]

      const denominator = 2 * (2 * s1 - s2 - s0)

      if (Math.abs(denominator) > 1e-10) {
        const adjustment = (s2 - s0) / denominator
        betterTau = tauEstimate + adjustment
      }
    }

    const pitchHz = this.sampleRate / betterTau

    if (pitchHz < this.MIN_FREQUENCY || pitchHz > this.MAX_FREQUENCY) {
      return { pitchHz: 0, confidence: 0 }
    }

    const confidence = Math.max(0, Math.min(1, 1 - yinBuffer[tauEstimate]))

    return { pitchHz, confidence }
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
    return this.calculateRMS(buffer) > threshold
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
   * @returns A `PitchDetectionResult`. If the signal is below the threshold, it returns a result indicating no pitch.
   * @defaultValue `rmsThreshold` is `this.DEFAULT_RMS_THRESHOLD`.
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

  /**
   * Gets the sample rate the detector was configured with.
   * @returns The sample rate in Hz.
   */
  getSampleRate(): number {
    return this.sampleRate
  }

  /**
   * Gets the effective frequency range the detector is configured to find.
   * @returns An object containing the min and max frequencies in Hz.
   */
  getFrequencyRange(): { min: number; max: number } {
    return {
      min: this.MIN_FREQUENCY,
      max: this.MAX_FREQUENCY,
    }
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
  return new PitchDetector(audioContext.sampleRate)
}
