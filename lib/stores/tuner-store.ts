import { create } from 'zustand'
import { MusicalNote } from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { AppError, toAppError, ERROR_CODES } from '@/lib/errors/app-error'
import { logger } from '@/lib/observability/logger'

type TunerState = 'IDLE' | 'INITIALIZING' | 'READY' | 'LISTENING' | 'DETECTED' | 'ERROR'
type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED'

interface TunerStore {
  // State
  state: TunerState
  permissionState: PermissionState
  error: AppError | null
  currentPitch: number | null
  currentNote: string | null
  centsDeviation: number | null
  confidence: number

  // Audio resources
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  mediaStream: MediaStream | null
  source: MediaStreamAudioSourceNode | null
  detector: PitchDetector | null
  gainNode: GainNode | null
  devices: MediaDeviceInfo[]
  deviceId: string | null
  sensitivity: number

  // Actions
  initialize: () => Promise<void>
  retry: () => Promise<void>
  reset: () => void
  updatePitch: (pitch: number, confidence: number) => void
  startListening: () => void
  stopListening: () => void
  loadDevices: () => Promise<void>
  setDeviceId: (deviceId: string) => void
  setSensitivity: (sensitivity: number) => void
}

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
        logger.log('Initialization aborted due to session token mismatch.')
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
      set({
        state: 'ERROR',
        permissionState: appError.code === ERROR_CODES.MIC_PERMISSION_DENIED ? 'DENIED' : 'PROMPT',
        error: appError,
      })
    }
  },

  retry: async () => {
    const { reset, initialize } = get()
    await reset()
    await initialize()
  },

  reset: async () => {
    initToken++
    const { mediaStream, audioContext, gainNode, source, analyser } = get()

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
    if (source) {
      source.disconnect()
    }
    if (gainNode) {
      gainNode.disconnect()
    }
    if (analyser) {
      analyser.disconnect()
    }
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close()
    }

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
        set({
          state: 'LISTENING',
          currentPitch: null,
          currentNote: null,
          centsDeviation: null,
          confidence: 0,
        })
      }
    } else {
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
    const { permissionState, initialize, reset } = get()

    // To get device labels, we need microphone permission. If we haven't asked yet,
    // we can trigger the prompt by doing a quick initialize/reset cycle.
    if (permissionState === 'PROMPT' && get().state === 'IDLE') {
      await initialize()
      await reset()
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
    const { state, reset, initialize } = get()
    if (state !== 'IDLE' && state !== 'ERROR') {
      await reset()
      await initialize()
    }
  },

  setSensitivity: (sensitivity: number) => {
    const { gainNode } = get()
    set({ sensitivity })
    if (gainNode) {
      gainNode.gain.value = sensitivity / 50
    }
  },
}))
