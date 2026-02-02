import { AudioFramePort, AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { PitchDetector, PitchDetectionResult } from '../pitch-detector'

export class WebAudioFrameAdapter implements AudioFramePort {
  private buffer: Float32Array

  constructor(
    private analyser: AnalyserNode
  ) {
    this.buffer = new Float32Array(analyser.fftSize)
  }

  getFrame(): Float32Array {
    this.analyser.getFloatTimeDomainData(this.buffer as Float32Array<ArrayBuffer>)
    return this.buffer
  }

  get sampleRate(): number {
    return this.analyser.context.sampleRate
  }
}

export class WebAudioLoopAdapter implements AudioLoopPort {
  constructor(private framePort: AudioFramePort) {}

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

export class PitchDetectorAdapter implements PitchDetectionPort {
  constructor(public readonly detector: PitchDetector) {}

  detect(frame: Float32Array): PitchDetectionResult {
    return this.detector.detectPitch(frame)
  }

  calculateRMS(frame: Float32Array): number {
    return this.detector.calculateRMS(frame)
  }
}
