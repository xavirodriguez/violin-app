/**
 * Audio Manager
 *
 * Infrastructure layer for managing Web Audio API resources.
 * Encapsulates the complexity of initialization, resource tracking, and cleanup.
 */

import { toAppError, ERROR_CODES } from '../errors/app-error'

export interface AudioResources {
  context: AudioContext
  stream: MediaStream
  analyser: AnalyserNode
  gainNode?: GainNode
}

export class AudioManager {
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private gainNode: GainNode | null = null

  /**
   * Initializes the audio pipeline.
   *
   * @param deviceId - Optional ID of the microphone to use.
   * @returns A promise that resolves to the initialized audio resources.
   * @throws AppError if microphone access is denied or hardware fails.
   */
  async initialize(deviceId?: string): Promise<AudioResources> {
    // 1. Ensure previous resources are cleaned up
    await this.cleanup()

    try {
      // 2. Request MediaStream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId
          ? {
              deviceId: { exact: deviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
      })

      // 3. Initialize AudioContext and Analyser
      this.context = new AudioContext()
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0

      // 4. Initialize Gain
      this.gainNode = this.context.createGain()

      // 5. Connect pipeline: source -> gain -> analyser
      this.source = this.context.createMediaStreamSource(this.stream)
      this.source.connect(this.gainNode)
      this.gainNode.connect(this.analyser)

      return {
        context: this.context,
        stream: this.stream,
        analyser: this.analyser,
        gainNode: this.gainNode,
      }
    } catch (err) {
      await this.cleanup()
      throw toAppError(err, ERROR_CODES.MIC_PERMISSION_DENIED)
    }
  }

  /**
   * Releases all audio resources and closes the context.
   */
  async cleanup(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    if (this.source) {
      this.source.disconnect()
      this.source = null
    }

    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.context && this.context.state !== 'closed') {
      try {
        await this.context.close()
      } catch (_err) {
        // Ignore errors during close
      }
      this.context = null
    }
  }

  getContext(): AudioContext | null {
    return this.context
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  setGain(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = value
    }
  }

  isActive(): boolean {
    return !!this.context && this.context.state !== 'closed'
  }
}

/**
 * Singleton instance of the AudioManager to be used across the application.
 */
export const audioManager = new AudioManager()
