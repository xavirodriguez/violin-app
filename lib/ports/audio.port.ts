import { PitchDetectionResult } from '../pitch-detector'

/**
 * Port for retrieving raw audio frames from an input source.
 *
 * @remarks
 * This interface abstracts the source of audio data (e.g., Web Audio AnalyserNode,
 * File API, or synthetic generators), facilitating testing and platform independence.
 *
 * **Implementation Contract**:
 * - Must provide PCM samples as 32-bit floats.
 * - Should aim for consistent frame delivery frequency.
 *
 * @public
 */
export interface AudioFramePort {
  /**
   * Retrieves the next available frame of audio data.
   *
   * @returns A buffer of PCM samples as 32-bit floats, typically in the range [-1.0, 1.0].
   *
   * @remarks
   * For performance reasons, implementations may return a reference to a recycled internal buffer.
   * Consumers should copy the data if it needs to be preserved.
   */
  getFrame(): Float32Array

  /**
   * The sample rate of the audio stream in Hz (e.g., 44100).
   *
   * @remarks
   * This value is critical for accurate pitch detection algorithms that rely on
   * time-frequency transformations. It must remain constant for the duration of a session.
   */
  readonly sampleRate: number
}

/**
 * Port for pitch detection and signal analysis.
 *
 * @remarks
 * Encapsulates the logic for extracting musical information from raw audio frames.
 *
 * **Statelessness**:
 * Implementations should ideally be stateless or handle internal state such that
 * detections are consistent and re-entrant.
 *
 * @public
 */
export interface PitchDetectionPort {
  /**
   * Detects the pitch and confidence of a given audio frame.
   *
   * @param frame - The raw PCM audio samples to analyze.
   * @returns A {@link PitchDetectionResult} containing frequency (Hz) and confidence level (0.0 to 1.0).
   *
   * @remarks
   * **Error Handling**:
   * This method should not throw. If detection fails or signal is too weak, it should
   * return a result with `confidence: 0` and `pitchHz: 0` (or `NaN`).
   */
  detect(frame: Float32Array): PitchDetectionResult

  /**
   * Calculates the Root Mean Square (RMS) of the frame, representing its volume/intensity.
   *
   * @param frame - The raw audio samples.
   * @returns The calculated RMS value, normalized between 0.0 (silence) and 1.0 (full scale).
   */
  calculateRMS(frame: Float32Array): number
}

/**
 * Port for managing an asynchronous audio processing loop.
 *
 * @remarks
 * Standardizes the execution of real-time audio analysis. This port replaces manual
 * `requestAnimationFrame` or `setInterval` with a managed lifecycle that
 * respects an {@link AbortSignal}.
 *
 * @public
 */
export interface AudioLoopPort {
  /**
   * Starts the high-frequency audio processing loop.
   *
   * @param onFrame - A callback executed for each new frame delivered by the source.
   * @param signal - An {@link AbortSignal} to gracefully terminate the loop and release resources.
   * @returns A promise that resolves when the loop has successfully stopped after cancellation.
   *
   * @example
   * ```ts
   * const controller = new AbortController();
   * await loopPort.start((frame) => {
   *   const result = detector.detect(frame);
   *   if (result.confidence > 0.9) {
   *     console.log(`Frequency: ${result.pitchHz.toFixed(1)} Hz`);
   *   }
   * }, controller.signal);
   * ```
   *
   * @throws Error - If the loop fails to start or encounters a fatal hardware error.
   */
  start(
    onFrame: (frame: Float32Array) => void,
    signal: AbortSignal
  ): Promise<void>
}
