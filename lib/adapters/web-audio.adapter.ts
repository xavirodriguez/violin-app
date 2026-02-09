import { AudioFramePort, AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { PitchDetector, PitchDetectionResult } from '../pitch-detector'

/**
 * Adapter that connects a Web Audio {@link AnalyserNode} to the {@link AudioFramePort}.
 *
 * @remarks
 * This class handles the extraction of time-domain data from the Web Audio graph
 * and ensures it's compatible with the internal audio processing pipeline.
 *
 * **Memory Management**: It uses a pre-allocated `Float32Array` buffer to minimize
 * garbage collection overhead during high-frequency sampling (typically 60Hz or more).
 *
 * **Browser Compatibility**: Relies on `getFloatTimeDomainData`, which is supported
 * in all modern browsers. In legacy environments, this may require a fallback or polyfill.
 *
 * @public
 */
export class WebAudioFrameAdapter implements AudioFramePort {
  /** Internal buffer used to store time-domain data. */
  private buffer: Float32Array

  /**
   * Creates an instance of WebAudioFrameAdapter.
   *
   * @param analyser - The Web Audio AnalyserNode to pull data from.
   */
  constructor(
    private analyser: AnalyserNode
  ) {
    this.buffer = new Float32Array(analyser.fftSize)
  }

  /**
   * Captures the current time-domain data from the analyser node.
   *
   * @remarks
   * This method uses `getFloatTimeDomainData` which provides PCM samples
   * in the range [-1.0, 1.0]. The returned buffer is shared across calls.
   *
   * @returns A {@link Float32Array} containing the audio samples.
   */
  getFrame(): Float32Array {
    this.analyser.getFloatTimeDomainData(this.buffer as any)
    return this.buffer
  }

  /**
   * Returns the sample rate of the underlying AudioContext.
   *
   * @remarks
   * The sample rate is determined by the hardware and browser settings (typically 44100Hz or 48000Hz).
   */
  get sampleRate(): number {
    return this.analyser.context.sampleRate
  }
}

/**
 * Adapter that implements {@link AudioLoopPort} using browser scheduling.
 *
 * @remarks
 * Uses `requestAnimationFrame` to drive the audio processing loop. This is ideal for
 * UI-driven applications as it automatically synchronizes with the display refresh rate.
 *
 * **Performance Note**: While suitable for UI-synced applications, this loop
 * will be throttled or paused by the browser when the tab is in the background
 * to save power. For background-stable processing, consider an implementation
 * using `AudioWorklet` or a `Web Worker`.
 *
 * @public
 */
export class WebAudioLoopAdapter implements AudioLoopPort {
  /**
   * Creates an instance of WebAudioLoopAdapter.
   *
   * @param framePort - The source of audio frames.
   */
  constructor(private framePort: AudioFramePort) {}

  /**
   * Starts the animation-frame-based audio loop.
   *
   * @remarks
   * The loop uses a recursive `requestAnimationFrame` pattern. It handles
   * cleanup by removing the abort listener once the signal is triggered.
   *
   * @param onFrame - Callback for each audio frame.
   * @param signal - AbortSignal to stop the loop.
   * @returns A promise that resolves when the loop is terminated.
   */
  async start(
    onFrame: (frame: Float32Array) => void,
    signal: AbortSignal
  ): Promise<void> {
    return new Promise((resolve) => {
      const loop = () => {
        if (signal.aborted) {
          resolve()
          return
        }

        onFrame(this.framePort.getFrame())
        requestAnimationFrame(loop)
      }

      const abortHandler = () => {
        signal.removeEventListener('abort', abortHandler)
        resolve()
      }

      signal.addEventListener('abort', abortHandler)

      loop()
    })
  }
}

/**
 * Adapter that wraps a standard {@link PitchDetector} to satisfy the {@link PitchDetectionPort} interface.
 *
 * @remarks
 * This serves as a bridge between the core pitch detection algorithm and the port-based architecture.
 * It ensures that the detector's output is correctly mapped to the domain results.
 *
 * @public
 */
export class PitchDetectorAdapter implements PitchDetectionPort {
  /**
   * Creates an instance of PitchDetectorAdapter.
   *
   * @param detector - The underlying pitch detector implementation.
   */
  constructor(public readonly detector: PitchDetector) {}

  /**
   * Detects pitch in the given audio frame.
   *
   * @remarks
   * Delegates to the internal `detector.detectPitch` method.
   *
   * @param frame - Audio samples.
   * @returns Detection result including pitch and confidence.
   */
  detect(frame: Float32Array): PitchDetectionResult {
    return this.detector.detectPitch(frame)
  }

  /**
   * Calculates the volume (RMS) of the given audio frame.
   *
   * @remarks
   * RMS (Root Mean Square) is used to determine if the audio signal is strong
   * enough for reliable pitch detection.
   *
   * @param frame - Audio samples.
   * @returns RMS value (typically 0.0 to 1.0).
   */
  calculateRMS(frame: Float32Array): number {
    return this.detector.calculateRMS(frame)
  }
}
