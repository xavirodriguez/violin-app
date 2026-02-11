import { AudioFramePort, AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { PitchDetector, PitchDetectionResult } from '../pitch-detector'

/**
 * Adapter that connects a Web Audio {@link AnalyserNode} to the {@link AudioFramePort}.
 *
 * @remarks
 * This class handles the extraction of time-domain data from the Web Audio graph
 * and ensures it's compatible with the internal audio processing pipeline.
 *
 * **Performance Optimization**:
 * It uses a pre-allocated `Float32Array` buffer to minimize garbage collection overhead
 * during high-frequency sampling (typically 60Hz or more). By reusing the same memory,
 * we avoid potential stuttering in the audio analysis pipeline.
 *
 * **Concurrency**:
 * This adapter is designed to be synchronous. Calls to `getFrame()` reflect the
 * state of the Web Audio buffer at the exact moment of invocation.
 *
 * @example
 * ```ts
 * const analyser = audioContext.createAnalyser();
 * const adapter = new WebAudioFrameAdapter(analyser);
 * const frame = adapter.getFrame();
 * console.log(`Sample Rate: ${adapter.sampleRate} Hz`);
 * ```
 *
 * @public
 */
export class WebAudioFrameAdapter implements AudioFramePort {
  /** Pre-allocated buffer for PCM data. */
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
   * in the range [-1.0, 1.0].
   *
   * @returns A {@link Float32Array} containing the audio samples. Note that
   * this is a reference to the internal pre-allocated buffer; if you need to
   * store the data across frames, you must copy it.
   */
  getFrame(): Float32Array {
    this.analyser.getFloatTimeDomainData(this.buffer as any)
    return this.buffer
  }

  /**
   * Returns the sample rate of the underlying AudioContext.
   *
   * @returns The sample rate in Hz (e.g., 44100 or 48000).
   */
  get sampleRate(): number {
    return this.analyser.context.sampleRate
  }
}

/**
 * Adapter that implements {@link AudioLoopPort} using browser scheduling.
 *
 * @remarks
 * Uses `requestAnimationFrame` to drive the audio processing loop. This aligns
 * the audio analysis frequency with the browser's display refresh rate,
 * which is usually sufficient for real-time musical feedback.
 *
 * **Performance & Throttling**:
 * While suitable for UI-synced applications, this loop will be throttled or
 * paused by the browser when the tab is in the background or minimized.
 * For background-stable processing, consider a Web Worker or AudioWorklet implementation.
 *
 * **Lifecycle**:
 * The loop is gracefully terminated when the provided {@link AbortSignal} is aborted.
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
   * @param onFrame - Callback for each audio frame. Receives the raw PCM samples.
   * @param signal - AbortSignal to stop the loop.
   * @returns A promise that resolves when the loop is terminated.
   *
   * @example
   * ```ts
   * const controller = new AbortController();
   * await loop.start((frame) => analyze(frame), controller.signal);
   * ```
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
   * @param frame - Audio samples in PCM format.
   * @returns Detection result including pitch (Hz) and confidence (0.0 to 1.0).
   */
  detect(frame: Float32Array): PitchDetectionResult {
    return this.detector.detectPitch(frame)
  }

  /**
   * Calculates the volume (RMS) of the given audio frame.
   *
   * @param frame - Audio samples.
   * @returns Root Mean Square value (typically 0.0 to 1.0).
   */
  calculateRMS(frame: Float32Array): number {
    return this.detector.calculateRMS(frame)
  }
}
