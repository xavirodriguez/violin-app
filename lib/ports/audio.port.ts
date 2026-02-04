import { PitchDetectionResult } from '../pitch-detector'

/**
 * Port for retrieving raw audio frames from an input source.
 *
 * @remarks
 * This interface abstracts the source of audio data (e.g., Web Audio AnalyserNode,
 * File API, or synthetic generators), facilitating testing and platform independence.
 *
 * @public
 */
export interface AudioFramePort {
  /**
   * Retrieves the next available frame of audio data.
   *
   * @returns A buffer of PCM samples as 32-bit floats, typically in the range [-1.0, 1.0].
   */
  getFrame(): Float32Array

  /**
   * The sample rate of the audio stream in Hz (e.g., 44100).
   */
  readonly sampleRate: number
}

/**
 * Port for pitch detection and signal analysis.
 *
 * @remarks
 * Encapsulates the logic for extracting musical information from raw audio frames.
 *
 * @public
 */
export interface PitchDetectionPort {
  /**
   * Detects the pitch and confidence of a given audio frame.
   *
   * @param frame - The raw audio samples to analyze.
   * @returns A {@link PitchDetectionResult} containing frequency and confidence level.
   *
   * @throws Never - Returns confidence 0 or NaN frequency on failure rather than throwing.
   */
  detect(frame: Float32Array): PitchDetectionResult

  /**
   * Calculates the Root Mean Square (RMS) of the frame, representing its volume/intensity.
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
 * Replaces manual requestAnimationFrame (RAF) or Web Worker intervals with a
 * standardized reactive stream of frames.
 *
 * @public
 */
export interface AudioLoopPort {
  /**
   * Starts the audio processing loop.
   *
   * @param onFrame - A callback executed for each new frame delivered by the hardware/source.
   * @param signal - An {@link AbortSignal} to gracefully terminate the loop.
   * @returns A promise that resolves when the loop has stopped.
   *
   * @example
   * ```ts
   * const controller = new AbortController();
   * await loopPort.start((frame) => {
   *   const pitch = detector.detect(frame);
   *   console.log(pitch);
   * }, controller.signal);
   * ```
   */
  start(
    onFrame: (frame: Float32Array) => void,
    signal: AbortSignal
  ): Promise<void>
}
