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
  private context: AudioContext | undefined = undefined
  private stream: MediaStream | undefined = undefined
  private analyser: AnalyserNode | undefined = undefined
  private source: MediaStreamAudioSourceNode | undefined = undefined
  private gainNode: GainNode | undefined = undefined

  /**
   * Initializes the audio pipeline.
   *
   * @param deviceId - Optional ID of the microphone to use.
   * @returns A promise that resolves to the initialized audio resources.
   * @throws AppError if microphone access is denied or hardware fails.
   */
  async initialize(deviceId?: string): Promise<AudioResources> {
    await this.cleanup()

    try {
      this.stream = await this.acquireMicStream(deviceId)
      this.initializeContextNodes()
      this.buildAudioGraph()
      return this.getAudioResources()
    } catch (err) {
      await this.cleanup()
      throw toAppError(err, ERROR_CODES.MIC_PERMISSION_DENIED)
    }
  }

  /**
   * Releases all audio resources and closes the context.
   */
  async cleanup(): Promise<void> {
    this.stopMediaTracks()
    this.disconnectAudioNodes()
    await this.closeAudioContext()
    this.resetResourceReferences()
  }

  /**
   * Retrieves the current Web Audio context.
   * @returns The active `AudioContext` or `undefined` if not initialized.
   */
  getContext(): AudioContext | undefined {
    const activeContext = this.context
    const isInitialized = !!activeContext
    const contextToReturn = isInitialized ? activeContext : undefined

    return contextToReturn
  }

  /**
   * Retrieves the raw microphone media stream.
   * @returns The active `MediaStream` or `undefined` if not initialized.
   */
  getStream(): MediaStream | undefined {
    const activeStream = this.stream
    const isInitialized = !!activeStream
    const streamToReturn = isInitialized ? activeStream : undefined

    return streamToReturn
  }

  /**
   * Retrieves the shared AnalyserNode for signal analysis.
   * @returns The active `AnalyserNode` or `undefined` if not initialized.
   */
  getAnalyser(): AnalyserNode | undefined {
    const activeAnalyser = this.analyser
    const isInitialized = !!activeAnalyser
    const analyserToReturn = isInitialized ? activeAnalyser : undefined

    return analyserToReturn
  }

  /**
   * Adjusts the input sensitivity by setting the gain node value.
   *
   * @param value - Gain value (usually 0.0 to 2.0).
   */
  setGain(value: number): void {
    const gainNode = this.gainNode
    const hasNode = !!gainNode
    if (hasNode) {
      gainNode.gain.value = value
    }
  }

  /**
   * Checks if the audio pipeline is currently running.
   * @returns `true` if context is initialized and not closed.
   */
  isActive(): boolean {
    const context = this.context
    const exists = !!context
    const isNotClosed = exists && context.state !== 'closed'
    const isCurrentlyActive = exists && isNotClosed

    return isCurrentlyActive
  }

  /**
   * Resumes the audio context if it is suspended.
   * Required for playback initiated by user interaction.
   */
  async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume()
    }
  }

  private async acquireMicStream(deviceId?: string): Promise<MediaStream> {
    const constraints = this.getAudioConstraints(deviceId)
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    const isValid = !!stream
    if (!isValid) {
      throw new Error('Failed to acquire microphone stream')
    }
    return stream
  }

  private getAudioConstraints(deviceId?: string): MediaStreamConstraints {
    const config = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    }

    return {
      audio: deviceId ? { ...config, deviceId: { exact: deviceId } } : config,
    }
  }

  private initializeContextNodes(): void {
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0
    this.gainNode = this.context.createGain()
  }

  private buildAudioGraph(): void {
    const hasContext = !!this.context && !!this.stream
    const hasNodes = !!this.gainNode && !!this.analyser
    if (!hasContext || !hasNodes) {
      throw new Error('Audio components not initialized')
    }
    this.source = this.context!.createMediaStreamSource(this.stream!)
    this.source.connect(this.gainNode!)
    this.gainNode!.connect(this.analyser!)
  }

  private getAudioResources(): AudioResources {
    const isReady = !!this.context && !!this.stream && !!this.analyser
    if (!isReady) {
      throw new Error('Required audio resources missing')
    }
    return {
      context: this.context!,
      stream: this.stream!,
      analyser: this.analyser!,
      gainNode: this.gainNode,
    }
  }

  private stopMediaTracks(): void {
    const activeStream = this.stream
    const hasStream = !!activeStream
    if (hasStream) {
      const tracks = activeStream.getTracks()
      tracks.forEach((track) => track.stop())
      this.stream = undefined
    }
  }

  private disconnectAudioNodes(): void {
    const sourceNode = this.source
    const gainNode = this.gainNode
    const analyserNode = this.analyser

    sourceNode?.disconnect()
    gainNode?.disconnect()
    analyserNode?.disconnect()

    this.source = undefined
    this.gainNode = undefined
    this.analyser = undefined
  }

  private async closeAudioContext(): Promise<void> {
    const context = this.context
    const isClosable = context && context.state !== 'closed'
    if (isClosable) {
      try {
        await context.close()
      } catch (error) {
        console.warn('Error closing AudioContext:', error)
      }
      this.context = undefined
    }
  }

  private resetResourceReferences(): void {
    const clearValue = undefined
    this.stream = clearValue
    this.source = clearValue
    this.gainNode = clearValue
    this.analyser = clearValue
    this.context = clearValue
  }
}

/**
 * Singleton instance of the AudioManager to be used across the application.
 */
export const audioManager = new AudioManager()
