import { PitchDetectionResult } from '../pitch-detector'

/**
 * Port for retrieving raw audio frames from an input source.
 *
 * @remarks
 * This interface abstracts the source of audio data (e.g., Web Audio AnalyserNode,
 * File API, or synthetic generators), facilitating testing and platform independence.
 *
 * **Concurrency Note**: Implementations must ensure that `getFrame()` is reentrant-safe
 * or explicitly documented as single-threaded if used in a Web Worker context.
 *
 * @public
 */
export interface AudioFramePort {
  /**
   * Retrieves the next available frame of audio data.
   *
   * @remarks
   * For performance reasons, many implementations will return a reference to a
   * pre-allocated internal buffer. Consumers should **not** mutate this buffer
   * and should copy the data if it needs to be persisted across multiple frames.
   *
   * @returns A buffer of PCM samples as 32-bit floats, typically in the range [-1.0, 1.0].
   */
  getFrame(): Float32Array

  /**
   * The sample rate of the audio stream in Hz (e.g., 44100).
   *
   * @remarks
   * This value is critical for accurate pitch detection algorithms that rely on
   * time-frequency transformations. It is assumed to be constant for the duration
   * of the port's lifecycle.
   */
  readonly sampleRate: number
}

/**
 * Port for pitch detection and signal analysis.
 *
 * @remarks
 * Encapsulates the logic for extracting musical information from raw audio frames.
 * Implementations should be stateless or handle state internally to ensure
 * detection consistency across frames.
 *
 * @public
 */
export interface PitchDetectionPort {
  /**
   * Detects the pitch and confidence of a given audio frame.
   *
   * @remarks
   * The detection algorithm's complexity (e.g., YIN, McLeod, FFT-based) determines
   * the latency of this call. High-frequency pipelines should monitor execution time.
   *
   * @param frame - The raw audio samples to analyze.
   * @returns A {@link PitchDetectionResult} containing frequency (Hz) and confidence level (0.0 to 1.0).
   *
   * @throws Never - Returns confidence 0 or NaN frequency on failure rather than throwing to avoid pipeline disruption.
   */
  detect(frame: Float32Array): PitchDetectionResult

  /**
   * Calculates the Root Mean Square (RMS) of the frame, representing its volume/intensity.
   *
   * @remarks
   * RMS provides a more stable representation of perceived loudness than peak amplitude.
   * Useful for noise gating and onset detection.
   *
   * @param frame - The raw audio samples.
   * @returns The calculated RMS value (typically between 0.0 and 1.0).
   */
  calculateRMS(frame: Float32Array): number
}

/**
 * Port for managing an asynchronous audio processing loop.
 *
 * @remarks
 * Standardizes the execution of real-time audio analysis. Replaces manual
 * `requestAnimationFrame` or `setInterval` with a managed lifecycle that
 * respects an {@link AbortSignal}.
 *
 * @public
 */
export interface AudioLoopPort {
  /**
   * Starts the audio processing loop.
   *
   * @remarks
   * The loop execution is tied to the provided `signal`. Once the signal is aborted,
   * the loop must terminate promptly and resolve the returned promise.
   *
   * @param onFrame - A callback executed for each new frame delivered by the hardware/source.
   * @param signal - An {@link AbortSignal} to gracefully terminate the loop.
   * @returns A promise that resolves when the loop has stopped.
   *
   * @example
   * ```ts
   * const controller = new AbortController();
   * await loopPort.start((frame) => {
   *   const result = detector.detect(frame);
   *   if (result.confidence > 0.9) {
   *     console.log(`Detected: ${result.pitchHz} Hz`);
   *   }
   * }, controller.signal);
   * ```
   */
  start(
    onFrame: (frame: Float32Array) => void,
    signal: AbortSignal
  ): Promise<void>
}
