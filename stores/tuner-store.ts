/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */

import { create } from 'zustand'
import { MusicalNote } from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { AppError, toAppError, ERROR_CODES } from '@/lib/errors/app-error'
import { logger } from '@/lib/observability/logger'

/** Possible states for the tuner state machine. */
type TunerState = 'IDLE' | 'INITIALIZING' | 'READY' | 'LISTENING' | 'DETECTED' | 'ERROR'

/** States for microphone permission handling. */
type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED'

/**
 * Interface representing the tuner store's state and actions.
 *
 * @remarks
 * State machine:
 * - `IDLE` -\> `INITIALIZING` -\> `READY` when `initialize()` is called.
 * - `READY` -\> `LISTENING` when `startListening()` is called.
 * - `LISTENING` \<-\> `DETECTED` based on whether a clear pitch is found.
 *
 * Error handling:
 * - Errors during initialization transition the state to `ERROR`.
 * - `retry()` can be used to attempt initialization again.
 */
interface TunerStore {
  /** The current high-level state of the tuner. */
  state: TunerState

  /** Current microphone permission status. */
  permissionState: PermissionState

  /** Detailed error object if the state is `ERROR`. */
  error: AppError | null

  /** The detected frequency in Hz. */
  currentPitch: number | null

  /** The musical name of the detected pitch (e.g., "A4"). */
  currentNote: string | null

  /** Deviation from the ideal pitch in cents. */
  centsDeviation: number | null

  /**
   * Confidence level of the pitch detection (0 to 1).
   * Typically \> 0.85 is considered a reliable signal.
   */
  confidence: number

  // Audio resources
  /** The Web Audio API context. */
  audioContext: AudioContext | null

  /** AnalyserNode for frequency analysis. */
  analyser: AnalyserNode | null

  /** The media stream from the microphone. */
  mediaStream: MediaStream | null

  /** The audio source node created from the media stream. */
  source: MediaStreamAudioSourceNode | null

  /** The pitch detection algorithm instance. */
  detector: PitchDetector | null

  /** Gain node to control input sensitivity. */
  gainNode: GainNode | null

  /** List of available audio input devices. */
  devices: MediaDeviceInfo[]

  /** ID of the currently selected audio input device. */
  deviceId: string | null

  /**
   * Input sensitivity (0 to 100).
   * Maps to gain: 0 -\> 0x, 50 -\> 1x, 100 -\> 2x.
   */
  sensitivity: number

  /**
   * Initializes the audio pipeline and requests microphone access.
   * @remarks
   * Implements a session guard using a token to prevent race conditions
   * if multiple initializations are triggered.
   */
  initialize: () => Promise<void>

  /** Resets the store and attempts to initialize again. */
  retry: () => Promise<void>

  /** Stops all audio processing and releases resources. */
  reset: () => Promise<void>

  /**
   * Updates the detected pitch and note based on new analysis results.
   * @param pitch - The detected frequency in Hz.
   * @param confidence - The confidence of the detection.
   */
  updatePitch: (pitch: number, confidence: number) => void

  /** Transitions state to `LISTENING`. Only valid if state is `READY`. */
  startListening: () => void

  /** Transitions state to `READY` and clears detection data. */
  stopListening: () => void

  /**
   * Enumerates available audio input devices.
   * @remarks
   * If permission is 'PROMPT', it will trigger a brief initialization/reset cycle
   * to gain the necessary permissions to see device labels.
   */
  loadDevices: () => Promise<void>

  /** Sets the active microphone device and re-initializes. */
  setDeviceId: (deviceId: string) => Promise<void>

  /**
   * Sets the input sensitivity and updates the gain node immediately.
   * @param sensitivity - New sensitivity value (0-100).
   */
  setSensitivity: (sensitivity: number) => void
}

/**
 * Hook for accessing the tuner store.
 */
export const useTunerStore = create<TunerStore>((set, get) => {
  let initToken = 0

  return {
    // Initial state
    state: 'IDLE',
    permissionState: 'PROMPT',
    error: null,
    currentPitch: null,
    currentNote: null,
    centsDeviation: null,
    confidence: 0,
    audioContext: null,
    analyser: null,
    mediaStream: null,
    source: null,
    detector: null,
    gainNode: null,
    devices: [],
    deviceId: null,
    sensitivity: 50,

    initialize: async () => {
      const { state: currentState, deviceId, sensitivity } = get()
      const token = ++initToken

      if (currentState !== 'IDLE' && currentState !== 'ERROR') {
        logger.warn(`Cannot initialize from state: ${currentState}`)
        return
      }

      set({ state: 'INITIALIZING', error: null })

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })

        if (token !== initToken) {
          stream.getTracks().forEach((track) => track.stop())
          logger.info('Initialization aborted due to session token mismatch.')
          return
        }

        const context = new AudioContext()
        const analyser = context.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0

        const source = context.createMediaStreamSource(stream)
        const gainNode = context.createGain()
        // Sensitivity to gain conversion: 50 -> 1, 100 -> 2, 0 -> 0
        gainNode.gain.value = sensitivity / 50

        source.connect(gainNode)
        gainNode.connect(analyser)

        const detector = new PitchDetector(context.sampleRate)

        if (token !== initToken) {
          logger.info('Initialization successful, but a new session has started. Discarding.')
          stream.getTracks().forEach((track) => track.stop())
          void context.close()
          return
        }

        set({
          state: 'READY',
          permissionState: 'GRANTED',
          audioContext: context,
          analyser,
          mediaStream: stream,
          source,
          detector,
          gainNode,
          error: null,
        })
      } catch (_err) {
        const appError = toAppError(_err, ERROR_CODES.MIC_GENERIC_ERROR)
        logger.error({
          msg: 'Failed to initialize microphone',
          err: appError,
          context: { deviceId },
        })

        if (token !== initToken) {
          logger.info('Initialization failed, but a new session has already started.')
          return
        }

        set({
          state: 'ERROR',
          permissionState:
            appError.code === ERROR_CODES.MIC_PERMISSION_DENIED ? 'DENIED' : 'PROMPT',
          error: appError,
        })
      }
    },

    retry: async () => {
      await get().reset()
      await get().initialize()
    },

    reset: async () => {
      initToken++ // Invalidate any in-flight initializations
      const { mediaStream, audioContext, gainNode, source, analyser } = get()

      // 1. Stop media stream tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }

      // 2. Disconnect all audio nodes
      if (source) {
        source.disconnect()
      }
      if (gainNode) {
        gainNode.disconnect()
      }
      if (analyser) {
        analyser.disconnect()
      }

      // 3. Close the AudioContext
      if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close()
      }

      // 4. Reset state, but preserve devices and deviceId
      set({
        state: 'IDLE',
        error: null,
        currentPitch: null,
        currentNote: null,
        centsDeviation: null,
        confidence: 0,
        audioContext: null,
        analyser: null,
        mediaStream: null,
        source: null,
        detector: null,
        gainNode: null,
      })
    },

    updatePitch: (pitch: number, confidence: number) => {
      const { state } = get()

      if (state !== 'LISTENING' && state !== 'DETECTED') {
        return
      }

      const hasSignal = confidence > 0.85 && pitch > 0

      if (hasSignal) {
        try {
          const note = MusicalNote.fromFrequency(pitch)
          set({
            state: 'DETECTED',
            currentPitch: pitch,
            currentNote: note.nameWithOctave,
            centsDeviation: note.centsDeviation,
            confidence,
          })
        } catch (_err) {
          logger.error({
            msg: 'Failed to create MusicalNote from frequency',
            err: _err,
            context: { pitch },
          })
          // On error, revert to listening state without valid pitch
          set({
            state: 'LISTENING',
            currentPitch: null,
            currentNote: null,
            centsDeviation: null,
            confidence: 0,
          })
        }
      } else {
        // If signal is lost, transition back to LISTENING
        set({
          state: 'LISTENING',
          currentPitch: null,
          currentNote: null,
          centsDeviation: null,
          confidence: 0,
        })
      }
    },

    startListening: () => {
      const { state } = get()
      if (state === 'READY') {
        set({ state: 'LISTENING' })
      } else {
        logger.warn(`Cannot start listening from state: ${state}`)
      }
    },

    stopListening: () => {
      const { state } = get()
      if (state === 'LISTENING' || state === 'DETECTED') {
        set({
          state: 'READY',
          currentPitch: null,
          currentNote: null,
          centsDeviation: null,
          confidence: 0,
        })
      } else {
        logger.warn(`Cannot stop listening from state: ${state}`)
      }
    },

    loadDevices: async () => {
      // To get device labels, we need microphone permission. If we haven't asked yet,
      // we can trigger the prompt by doing a quick initialize/reset cycle.
      if (get().permissionState === 'PROMPT' && get().state === 'IDLE') {
        await get().initialize()
        await get().reset()
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioDevices = devices.filter((device) => device.kind === 'audioinput')
        set({ devices: audioDevices })
      } catch (err) {
        logger.error({ msg: 'Error loading audio devices', err })
      }
    },

    setDeviceId: async (deviceId: string) => {
      set({ deviceId })
      // Re-initialize to apply the new device
      const { state } = get()
      if (state !== 'IDLE' && state !== 'ERROR') {
        await get().reset()
        await get().initialize()
      }
    },

    setSensitivity: (sensitivity: number) => {
      const { gainNode } = get()
      set({ sensitivity })
      if (gainNode) {
        gainNode.gain.value = sensitivity / 50
      }
    },
  }
})
