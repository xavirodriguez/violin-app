import { create } from "zustand"
import { MusicalNote } from "@/lib/musical-note"
import { PitchDetector } from "@/lib/pitch-detector"

type TunerState = "IDLE" | "INITIALIZING" | "READY" | "LISTENING" | "DETECTED" | "ERROR"

interface TunerStore {
  // State
  state: TunerState
  error: string | null
  currentPitch: number | null
  currentNote: string | null
  centsDeviation: number | null
  confidence: number

  // Audio resources
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  mediaStream: MediaStream | null
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
  loadDevices: () => Promise<void>
  setDeviceId: (deviceId: string) => void
  setSensitivity: (sensitivity: number) => void
}

export const useTunerStore = create<TunerStore>((set, get) => ({
  // Initial state
  state: "IDLE",
  error: null,
  currentPitch: null,
  currentNote: null,
  centsDeviation: null,
  confidence: 0,
  audioContext: null,
  analyser: null,
  mediaStream: null,
  detector: null,
  gainNode: null,
  devices: [],
  deviceId: null,
  sensitivity: 50,

  initialize: async () => {
    const { state: currentState, deviceId, sensitivity } = get()

    if (currentState !== "IDLE" && currentState !== "ERROR") {
      console.warn(`Cannot initialize from state: ${currentState}`)
      return
    }

    set({ state: "INITIALIZING", error: null })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

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
        state: "READY",
        audioContext: context,
        analyser,
        mediaStream: stream,
        detector,
        gainNode,
        error: null,
      })
    } catch (_err) {
      const errorMessage = _err instanceof Error ? _err.message : "Microphone access denied"
      set({
        state: "ERROR",
        error: errorMessage,
      })
    }
  },

  retry: async () => {
    const { initialize } = get()
    await initialize()
  },

  reset: () => {
    const { mediaStream, audioContext, gainNode } = get()

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
    if (gainNode) {
      gainNode.disconnect()
    }
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close()
    }

    set({
      state: "IDLE",
      error: null,
      currentPitch: null,
      currentNote: null,
      centsDeviation: null,
      confidence: 0,
      audioContext: null,
      analyser: null,
      mediaStream: null,
      detector: null,
      gainNode: null,
    })
  },

  updatePitch: (pitch: number, confidence: number) => {
    const { state } = get()

    if (state !== "LISTENING" && state !== "DETECTED" && state !== "READY") {
      return
    }

    const hasSignal = confidence > 0.85 && pitch > 0

    if (hasSignal) {
      try {
        const note = MusicalNote.fromFrequency(pitch)
        set({
          state: "DETECTED",
          currentPitch: pitch,
          currentNote: note.getFullName(),
          centsDeviation: note.centsDeviation,
          confidence,
        })
      } catch (_err) {
        set({
          state: "READY",
          currentPitch: null,
          currentNote: null,
          centsDeviation: null,
          confidence: 0,
        })
      }
    } else {
      set({
        state: "READY",
        currentPitch: null,
        currentNote: null,
        centsDeviation: null,
        confidence: 0,
      })
    }
  },

  loadDevices: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter((device) => device.kind === "audioinput")
      set({ devices: audioDevices })
    } catch (err) {
      console.error("Error loading audio devices:", err)
    }
  },

  setDeviceId: (deviceId: string) => {
    set({ deviceId })
    // Re-initialize to apply the new device
    const { state, reset, initialize } = get()
    if (state !== "IDLE" && state !== "ERROR") {
      reset()
      initialize()
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
