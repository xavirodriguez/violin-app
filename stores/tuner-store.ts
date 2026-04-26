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
import { toAppError, ERROR_CODES, AppError } from '@/lib/errors/app-error'
import { logger } from '@/lib/observability/logger'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import type { TunerStore } from '@/lib/domain/musical-types'

/**
 * Zustand hook for accessing the TunerStore.
 *
 * @remarks
 * The TunerStore manages the state of the standalone violin tuner. It is designed
 * for high-frequency updates and robust hardware orchestration.
 *
 * **Core Responsibilities**:
 * - **Permission Lifecycle**: Tracks and triggers microphone authorization states.
 * - **Signal Analysis**: Interfaces with `PitchDetector` to extract note and deviation.
 * - **Device Management**: Allows selection and enumeration of audio input hardware.
 * - **Gain Control**: Adjusts sensitivity to match different environments (quiet rooms vs. loud studios).
 *
 * **Concurrency & Safety**:
 * It uses an internal `initToken` pattern to handle race conditions during asynchronous
 * initialization. If `initialize()` is called multiple times, only the result of the
 * latest call is applied to the store.
 *
 * @example
 * ```ts
 * const { state, initialize, updatePitch } = useTunerStore();
 * ```
 *
 * @public
 */
export const useTunerStore = create<TunerStore>()((set, get) => {
  let initToken = 0

  return {
    // Initial state
    state: { kind: 'IDLE' },
    permissionState: 'PROMPT',
    detector: undefined,
    devices: [],
    deviceId: undefined,
    sensitivity: 50,

    /**
     * Getter that returns the shared Web Audio AnalyserNode from the audio manager.
     *
     * @remarks
     * This node can be used by visualization components (e.g., Oscilloscopes)
     * without needing to manage the audio context themselves.
     */
    get analyser() {
      return audioManager.getAnalyser()
    },

    /**
     * Initializes the microphone and audio pipeline for tuning.
     *
     * @remarks
     * This method:
     * 1. Requests user permissions via the `audioManager`.
     * 2. Sets up the Web Audio context and analyzer.
     * 3. Instantiates the `PitchDetector` algorithm.
     *
     * **Token-based Guard**: It implements a token-based guard to prevent stale
     * initialization results from being applied if a reset or another initialize
     * call occurs during the async process.
     *
     * **State Transitions**:
     * `IDLE` -\> `INITIALIZING` -\> `READY` (success) or `ERROR` (failure).
     *
     * @returns A promise that resolves when initialization is complete.
     * @throws AppError - If microphone access is denied or hardware fails.
     */
    initialize: async () => {
      const { state: currentState, deviceId } = get()
      const token = ++initToken

      const isEligible = currentState.kind === 'IDLE' || currentState.kind === 'ERROR'
      if (!isEligible) {
        logger.warn(`Cannot initialize from state: ${currentState.kind}`)
        return
      }

      prepareTunerInitialization(set, token)
      await executeAudioInit({ set, get, token, deviceId })
    },

    /**
     * Resets the store and attempts to re-initialize the audio pipeline.
     *
     * @remarks
     * Useful for recovering from error states or refreshing hardware connections.
     *
     * @returns A promise that resolves when re-initialization is complete.
     */
    retry: async () => {
      await get().reset()
      await get().initialize()
    },

    /**
     * Stops the tuner, releases hardware resources, and resets the state to IDLE.
     *
     * @remarks
     * Effectively invalidates any in-flight `initialize` calls by incrementing `initToken`.
     *
     * @returns A promise that resolves when cleanup is complete.
     */
    reset: async () => {
      initToken++ // Invalidate any in-flight initializations
      await audioManager.cleanup()

      set({
        state: { kind: 'IDLE' },
        detector: undefined,
      })
    },

    /**
     * Processes a raw pitch/confidence pair and updates the detected note state.
     *
     * @remarks
     * **Signal Processing**:
     * - **Gating**: Implements a strict confidence threshold (0.85) to filter out
     *   ambient noise and low-energy signals.
     * - **State Machine**: Automatically transitions the store kind to `DETECTED`
     *   when a valid signal is found, and reverts to `LISTENING` when the signal
     *   is lost or falls below the threshold.
     * - **Domain Mapping**: Uses scientific pitch notation (via {@link MusicalNote})
     *   to determine the closest chromatic note and its deviation in cents.
     *
     * @param pitch - The detected frequency in Hz.
     * @param confidence - The detector's confidence (0.0 to 1.0).
     */
    updatePitch: (pitch: number, confidence: number) => {
      const { state } = get()
      const isEligible = state.kind === 'LISTENING' || state.kind === 'DETECTED'

      if (!isEligible) return

      const token = state.sessionToken
      const hasSignal = confidence > 0.85 && pitch > 0
      const params = { pitch, confidence, token }

      if (hasSignal) {
        get().handleDetectedPitch(params)
      } else {
        set({ state: { kind: 'LISTENING', sessionToken: token } })
      }
    },

    handleDetectedPitch: (params: {
      pitch: number
      confidence: number
      token: number | string
    }) => {
      const { pitch, confidence, token } = params
      try {
        const note = MusicalNote.fromFrequency(pitch)
        setDetectedPitchState({ set, pitch, note, confidence, token })
      } catch (err) {
        handlePitchDetectionError({ set, err, pitch, token })
      }
    },

    /**
     * Starts the listening phase of the tuner.
     *
     * @remarks
     * Requires the tuner to be in the `READY` state.
     */
    startListening: () => {
      const { state } = get()
      if (state.kind === 'READY') {
        set({ state: { kind: 'LISTENING', sessionToken: state.sessionToken } })
      } else {
        logger.warn(`Cannot start listening from state: ${state.kind}`)
      }
    },

    /**
     * Pauses the listening phase, keeping the microphone active but ignoring input.
     *
     * @remarks
     * Transitions the state back to `READY`.
     */
    stopListening: () => {
      const { state } = get()
      const canStop = state.kind === 'LISTENING' || state.kind === 'DETECTED'

      if (canStop) {
        set({ state: { kind: 'READY', sessionToken: state.sessionToken } })
      } else {
        logger.warn(`Cannot stop listening from state: ${state.kind}`)
      }
    },

    /**
     * Enumerates available audio input devices and updates the `devices` list.
     *
     * @remarks
     * **Permission Handling**: Triggers a brief initialization cycle if permissions
     * are missing to ensure device labels can be read (browsers hide labels for
     * un-authorized hardware).
     *
     * @returns A promise that resolves when the device list is updated.
     */
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

    /**
     * Switches the preferred audio input device and re-initializes the pipeline.
     *
     * @remarks
     * **Lifecycle Handling**:
     * If the tuner is currently active (i.e., not in `IDLE` or `ERROR` state),
     * this method will automatically trigger a `reset()` and `initialize()`
     * sequence to apply the new hardware setting without manual user intervention.
     *
     * @param deviceId - The hardware ID of the device to use.
     * @returns A promise that resolves when the hardware switch and re-initialization are complete.
     */
    setDeviceId: async (deviceId: string) => {
      set({ deviceId })
      // Re-initialize to apply the new device
      const { state } = get()
      if (state.kind !== 'IDLE' && state.kind !== 'ERROR') {
        await get().reset()
        await get().initialize()
      }
    },

    /**
     * Adjusts the input gain/sensitivity.
     *
     * @remarks
     * Values from 0 to 100 are mapped to a gain range of 0.0 to 2.0.
     *
     * @param sensitivity - Sensitivity value (0-100).
     */
    setSensitivity: (sensitivity: number) => {
      set({ sensitivity })
      audioManager.setGain(sensitivity / 50)
    },
  }
})

type TunerSet = (
  partial:
    | TunerStore
    | Partial<TunerStore>
    | ((state: TunerStore) => TunerStore | Partial<TunerStore>),
  replace?: false | undefined,
) => void

function prepareTunerInitialization(set: TunerSet, token: number) {
  const initializingState = { kind: 'INITIALIZING' as const, sessionToken: token }
  const nextState = { state: initializingState }
  set(nextState)
}

async function executeAudioInit(params: {
  set: TunerSet
  get: () => TunerStore
  token: number
  deviceId: string | undefined
}) {
  const { set, get, token, deviceId } = params
  try {
    const { context } = await audioManager.initialize(deviceId ?? undefined)
    const isStale = isSessionStale(get().state, token)
    if (isStale) return await handleStaleSuccess()

    audioManager.setGain(get().sensitivity / 50)
    const detector = new PitchDetector(context.sampleRate)
    commitTunerReadyState({ set, token, detector })
  } catch (err) {
    handleTunerInitError({ set, get, err, token, deviceId })
  }
}

function isSessionStale(state: TunerStore['state'], token: number | string): boolean {
  const hasToken = 'sessionToken' in state
  const isStale = hasToken && state.sessionToken !== token

  return isStale || !hasToken
}

function logStaleAbortion() {
  const message = 'Initialization aborted due to session token mismatch.'
  logger.info(message)
}

async function handleStaleSuccess() {
  await audioManager.cleanup()
  logStaleAbortion()
}

function commitTunerReadyState(params: { set: TunerSet; token: number; detector: PitchDetector }) {
  const { set, token, detector } = params
  const readyState = { kind: 'READY' as const, sessionToken: token }
  set({
    state: readyState,
    permissionState: 'GRANTED',
    detector,
  })
}

function handleTunerInitError(params: {
  set: TunerSet
  get: () => TunerStore
  err: unknown
  token: number
  deviceId: string | undefined
}) {
  const { set, get, err, token, deviceId } = params
  const isStale = isSessionStale(get().state, token)
  if (isStale) return logStaleAbortion()

  const appError = toAppError(err, ERROR_CODES.MIC_GENERIC_ERROR)
  logTunerError(appError, deviceId)

  const permission = appError.code === ERROR_CODES.MIC_PERMISSION_DENIED ? 'DENIED' : 'PROMPT'
  set({ state: { kind: 'ERROR', error: appError }, permissionState: permission })
}

function logTunerError(err: AppError, deviceId: string | undefined) {
  const msg = 'Failed to initialize microphone'
  const context = { deviceId }
  logger.error({ msg, err, context })
}

function setDetectedPitchState(params: {
  set: TunerSet
  pitch: number
  note: MusicalNote
  confidence: number
  token: number | string
}) {
  const { set, pitch, note, confidence, token } = params
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
}

function handlePitchDetectionError(params: {
  set: TunerSet
  err: unknown
  pitch: number
  token: number | string
}) {
  const { set, err, pitch, token } = params
  const msg = 'Pitch creation failed'
  const context = { pitch }
  logger.error({ msg, err, context })
  set({ state: { kind: 'LISTENING', sessionToken: token } })
}
