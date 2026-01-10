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

  // Actions
  initialize: () => Promise<void>
  retry: () => Promise<void>
  reset: () => void
  updatePitch: (pitch: number, confidence: number) => void
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

  initialize: async () => {
    const currentState = get().state

    if (currentState !== "IDLE" && currentState !== "ERROR") {
      console.warn(`Cannot initialize from state: ${currentState}`)
      return
    }

    set({ state: "INITIALIZING", error: null })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
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
      source.connect(analyser)

      const detector = new PitchDetector(context.sampleRate)

      set({
        state: "READY",
        audioContext: context,
        analyser,
        mediaStream: stream,
        detector,
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
    const { mediaStream, audioContext } = get()

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
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
        // Invalid frequency, just update state
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
}))
