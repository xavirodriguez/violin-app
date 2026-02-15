/**
 * Audio Manager
 *
 * Infrastructure layer for managing Web Audio API resources.
 * Encapsulates the complexity of initialization, resource tracking, and cleanup.
 */

import { toAppError, ERROR_CODES } from '../errors/app-error'

/**
 * Collection of Web Audio resources managed by the {@link AudioManager}.
 *
 * @public
 */
export interface AudioResources {
  /** The primary Web Audio API context. */
  context: AudioContext
  /** The raw media stream from the input device (microphone). */
  stream: MediaStream
  /** The analyser node used for pitch detection and visualization. */
  analyser: AnalyserNode
  /** Optional gain node for sensitivity adjustment. */
  gainNode?: GainNode
}

/**
 * Service for managing hardware-level Web Audio API resources.
 *
 * @remarks
 * This class encapsulates the lifecycle of the `AudioContext` and `MediaStream`.
 * It provides a singleton interface to ensure that only one microphone handle
 * is active at any given time, preventing resource leaks and hardware conflicts.
 *
 * **Resource Lifecycle**:
 * 1. **Initialize**: Acquires microphone access and creates the audio graph.
 * 2. **Cleanup**: Disconnects all nodes and closes the audio context.
 *
 * @public
 */
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

  /**
   * Retrieves the current Web Audio context.
   * @returns The active `AudioContext` or `null` if not initialized.
   */
  getContext(): AudioContext | null {
    return this.context
  }

  /**
   * Retrieves the raw microphone media stream.
   * @returns The active `MediaStream` or `null` if not initialized.
   */
  getStream(): MediaStream | null {
    return this.stream
  }

  /**
   * Retrieves the shared AnalyserNode for signal analysis.
   * @returns The active `AnalyserNode` or `null` if not initialized.
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  /**
   * Adjusts the input sensitivity by setting the gain node value.
   *
   * @param value - Gain value (usually 0.0 to 2.0).
   */
  setGain(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = value
    }
  }

  /**
   * Checks if the audio pipeline is currently running.
   * @returns `true` if context is initialized and not closed.
   */
  isActive(): boolean {
    return !!this.context && this.context.state !== 'closed'
  }
}

/**
 * Singleton instance of the AudioManager to be used across the application.
 */
export const audioManager = new AudioManager()
