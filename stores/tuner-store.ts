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
import { audioManager } from '@/lib/infrastructure/audio-manager'

/**
 * Possible states for the tuner state machine.
 * @remarks Uses a Discriminated Union to ensure that properties like `pitch` or `error`
 * are only accessible when the state machine is in the appropriate phase.
 * Transitions: IDLE -\> INITIALIZING -\> READY -\> LISTENING \<-\> DETECTED
 */
type TunerState =
  | { kind: 'IDLE' }
  | { kind: 'INITIALIZING'; readonly sessionToken: number }
  | { kind: 'READY'; readonly sessionToken: number }
  | { kind: 'LISTENING'; readonly sessionToken: number }
  | {
      kind: 'DETECTED'
      pitch: number
      note: string
      cents: number
      confidence: number
      readonly sessionToken: number
    }
  | { kind: 'ERROR'; error: AppError }

/** States for microphone permission handling. */
type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED'

/**
 * Interface representing the tuner store's state and actions.
 */
interface TunerStore {
  /**
   * Current state with session tracking.
   *
   * @remarks
   * States with `sessionToken` prevent stale updates from previous sessions.
   * If you call `initialize()` twice, only the latest session updates state.
   */
  state: TunerState

  /** Current microphone permission status. */
  permissionState: PermissionState

  // Domain Logic resources
  /** The pitch detection algorithm instance. */
  detector: PitchDetector | null

  /** List of available audio input devices. */
  devices: MediaDeviceInfo[]

  /** ID of the currently selected audio input device. */
  deviceId: string | null

  /**
   * Input sensitivity (0 to 100).
   * Maps to gain: 0 -\> 0x, 50 -\> 1x, 100 -\> 2x.
   */
  sensitivity: number

  /** Derived getter for the current analyser. */
  analyser: AnalyserNode | null

  /**
   * Initializes audio pipeline with automatic session management.
   *
   * @remarks
   * **Concurrency Safety**:
   * - Multiple calls are safe: previous sessions are automatically invalidated
   * - Uses internal token (exposed in state.sessionToken) to prevent race conditions
   * - If a previous initialization is pending, it will be cancelled
   *
   * **State Transitions**:
   * - IDLE → INITIALIZING → READY (success)
   * - IDLE → INITIALIZING → ERROR (failure)
   *
   * @throws Never throws - errors are captured in state.error
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
export const useTunerStore = create<TunerStore>()((set, get) => {
  let initToken = 0

  return {
    // Initial state
    state: { kind: 'IDLE' },
    permissionState: 'PROMPT',
    detector: null,
    devices: [],
    deviceId: null,
    sensitivity: 50,

    get analyser() {
      return audioManager.getAnalyser()
    },

    initialize: async () => {
      const { state: currentState, deviceId, sensitivity } = get()
      const token = ++initToken

      if (currentState.kind !== 'IDLE' && currentState.kind !== 'ERROR') {
        logger.warn(`Cannot initialize from state: ${currentState.kind}`)
        return
      }

      set({ state: { kind: 'INITIALIZING', sessionToken: token } })

      try {
        const { context } = await audioManager.initialize(deviceId ?? undefined)

        if (token !== initToken) {
          await audioManager.cleanup()
          logger.info('Initialization aborted due to session token mismatch.')
          return
        }

        // Apply current sensitivity
        audioManager.setGain(sensitivity / 50)

        const detector = new PitchDetector(context.sampleRate)

        set({
          state: { kind: 'READY', sessionToken: token },
          permissionState: 'GRANTED',
          detector,
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
          state: { kind: 'ERROR', error: appError },
          permissionState:
            appError.code === ERROR_CODES.MIC_PERMISSION_DENIED ? 'DENIED' : 'PROMPT',
        })
      }
    },

    retry: async () => {
      await get().reset()
      await get().initialize()
    },

    reset: async () => {
      initToken++ // Invalidate any in-flight initializations
      await audioManager.cleanup()

      set({
        state: { kind: 'IDLE' },
        detector: null,
      })
    },

    updatePitch: (pitch: number, confidence: number) => {
      const { state } = get()

      if (state.kind !== 'LISTENING' && state.kind !== 'DETECTED') {
        return
      }

      const token = state.sessionToken
      const hasSignal = confidence > 0.85 && pitch > 0

      if (hasSignal) {
        try {
          const note = MusicalNote.fromFrequency(pitch)
          set({
            state: {
              kind: 'DETECTED',
              pitch,
              note: note.nameWithOctave,
              cents: note.centsDeviation,
              confidence,
              sessionToken: token,
            },
          })
        } catch (_err) {
          logger.error({
            msg: 'Failed to create MusicalNote from frequency',
            err: _err,
            context: { pitch },
          })
          // On error, revert to listening state without valid pitch
          set({ state: { kind: 'LISTENING', sessionToken: token } })
        }
      } else {
        // If signal is lost, transition back to LISTENING
        set({ state: { kind: 'LISTENING', sessionToken: token } })
      }
    },

    startListening: () => {
      const { state } = get()
      if (state.kind === 'READY') {
        set({ state: { kind: 'LISTENING', sessionToken: state.sessionToken } })
      } else {
        logger.warn(`Cannot start listening from state: ${state.kind}`)
      }
    },

    stopListening: () => {
      const { state } = get()
      if (state.kind === 'LISTENING' || state.kind === 'DETECTED') {
        set({ state: { kind: 'READY', sessionToken: state.sessionToken } })
      } else {
        logger.warn(`Cannot stop listening from state: ${state.kind}`)
      }
    },

    loadDevices: async () => {
      // To get device labels, we need microphone permission. If we haven't asked yet,
      // we can trigger the prompt by doing a quick initialize/reset cycle.
      if (get().permissionState === 'PROMPT' && get().state.kind === 'IDLE') {
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
      if (state.kind !== 'IDLE' && state.kind !== 'ERROR') {
        await get().reset()
        await get().initialize()
      }
    },

    setSensitivity: (sensitivity: number) => {
      set({ sensitivity })
      audioManager.setGain(sensitivity / 50)
    },
  }
})
