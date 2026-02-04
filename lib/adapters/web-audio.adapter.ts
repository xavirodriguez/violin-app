import { AudioFramePort, AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { PitchDetector, PitchDetectionResult } from '../pitch-detector'

/**
 * Adapter that connects a Web Audio {@link AnalyserNode} to the {@link AudioFramePort}.
 *
 * @remarks
 * This class handles the extraction of time-domain data from the Web Audio graph
 * and ensures it's compatible with the internal audio processing pipeline.
 *
 * @public
 */
export class WebAudioFrameAdapter implements AudioFramePort {
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
   * @returns A {@link Float32Array} containing the audio samples.
   */
  getFrame(): Float32Array {
    this.analyser.getFloatTimeDomainData(this.buffer as Float32Array<ArrayBuffer>)
    return this.buffer
  }

  /**
   * Returns the sample rate of the underlying AudioContext.
   */
  get sampleRate(): number {
    return this.analyser.context.sampleRate
  }
}

/**
 * Adapter that implements {@link AudioLoopPort} using browser scheduling.
 *
 * @remarks
 * Uses `requestAnimationFrame` to drive the audio processing loop, which is
 * suitable for UI-synced applications but may be throttled in background tabs.
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
   * @param frame - Audio samples.
   * @returns Detection result including pitch and confidence.
   */
  detect(frame: Float32Array): PitchDetectionResult {
    return this.detector.detectPitch(frame)
  }

  /**
   * Calculates the volume (RMS) of the given audio frame.
   *
   * @param frame - Audio samples.
   * @returns RMS value.
   */
  calculateRMS(frame: Float32Array): number {
    return this.detector.calculateRMS(frame)
  }
}
