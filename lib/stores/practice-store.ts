import { create } from "zustand"
import { MusicalNote } from "@/lib/musical-note"
import { PitchDetector } from "@/lib/pitch-detector"
import { useAnalyticsStore } from "./analytics-store"

type PracticeState =
  | "IDLE"
  | "LOADED"
  | "INITIALIZING"
  | "PRACTICING"
  | "NOTE_DETECTED"
  | "VALIDATING"
  | "NOTE_COMPLETED"
  | "EXERCISE_COMPLETE"
  | "ERROR"

interface Note {
  pitch: string
  duration: string
  measure: number
}

interface Exercise {
  id: string
  name: string
  notes: Note[]
}

interface PracticeStore {
  // State
  state: PracticeState
  error: string | null

  // Exercise data
  currentExercise: Exercise | null
  currentNoteIndex: number
  completedNotes: boolean[]

  // Detection data
  detectedPitch: number | null
  confidence: number
  isInTune: boolean
  centsOff: number | null

  // Timing
  noteStartTime: number | null
  holdDuration: number
  requiredHoldTime: number

  // Audio resources
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  mediaStream: MediaStream | null
  detector: PitchDetector | null

  // Actions
  loadExercise: (exercise: Exercise) => void
  start: () => Promise<void>
  stop: () => void
  reset: () => void
  updateDetectedPitch: (pitch: number, confidence: number, rms: number) => void
  advanceToNextNote: () => void
  completeExercise: () => void
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  // Initial state
  state: "IDLE",
  error: null,
  currentExercise: null,
  currentNoteIndex: 0,
  completedNotes: [],
  detectedPitch: null,
  confidence: 0,
  isInTune: false,
  centsOff: null,
  noteStartTime: null,
  holdDuration: 0,
  requiredHoldTime: 500,
  audioContext: null,
  analyser: null,
  mediaStream: null,
  detector: null,

  loadExercise: (exercise) => {
    const { state } = get()

    if (state !== "IDLE" && state !== "EXERCISE_COMPLETE") {
      console.warn(`Cannot load exercise from state: ${state}`)
      return
    }

    set({
      state: "LOADED",
      currentExercise: exercise,
      currentNoteIndex: 0,
      completedNotes: new Array(exercise.notes.length).fill(false),
      error: null,
    })
  },

  start: async () => {
    // Start analytics session
    const { state, currentExercise } = get()
    if (currentExercise) {
      useAnalyticsStore.getState().startSession(
        currentExercise.id,
        currentExercise.name,
        'practice'
      )
    }

    if (!currentExercise) {
      set({ state: "ERROR", error: "No exercise loaded" })
      return
    }

    if (state !== "LOADED" && state !== "EXERCISE_COMPLETE") {
      console.warn(`Cannot start from state: ${state}`)
      return
    }

    set({ state: "INITIALIZING" })

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
        state: "PRACTICING",
        audioContext: context,
        analyser,
        mediaStream: stream,
        detector,
        currentNoteIndex: 0,
        completedNotes: new Array(currentExercise.notes.length).fill(false),
        noteStartTime: null,
        holdDuration: 0,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Audio initialization failed"
      set({ state: "ERROR", error: errorMessage })
    }
  },

  stop: () => {
    // End analytics session if active
    useAnalyticsStore.getState().endSession()
    const { mediaStream, audioContext } = get()

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close()
    }

    set({
      state: "LOADED",
      audioContext: null,
      analyser: null,
      mediaStream: null,
      detector: null,
      noteStartTime: null,
      holdDuration: 0,
      detectedPitch: null,
      confidence: 0,
      isInTune: false,
      centsOff: null,
    })
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
      currentExercise: null,
      currentNoteIndex: 0,
      completedNotes: [],
      detectedPitch: null,
      confidence: 0,
      isInTune: false,
      centsOff: null,
      noteStartTime: null,
      holdDuration: 0,
      audioContext: null,
      analyser: null,
      mediaStream: null,
      detector: null,
    })
  },

  updateDetectedPitch: (pitch: number, confidence: number, rms: number) => {
    const { state, currentExercise, currentNoteIndex, noteStartTime, requiredHoldTime, centsOff } = get()

    if (!["PRACTICING", "NOTE_DETECTED", "VALIDATING"].includes(state)) {
      return
    }

    if (!currentExercise || currentNoteIndex >= currentExercise.notes.length) {
      return
    }

    const targetNote = currentExercise.notes[currentNoteIndex]
    const targetPitchName = targetNote.pitch

    const hasSignal = rms > 0.01 && confidence > 0.85

    if (!hasSignal) {
      set({
        state: "PRACTICING",
        noteStartTime: null,
        holdDuration: 0,
        detectedPitch: null,
        confidence: 0,
        isInTune: false,
        centsOff: null,
      })
      return
    }

    try {
      const detectedNote = MusicalNote.fromFrequency(pitch)
      const targetNoteObj = MusicalNote.fromNoteName(
        targetPitchName.replace(/\d/, ""),
        Number.parseInt(targetPitchName.match(/\d/)?.[0] || "4"),
      )

      const isCorrectNote = detectedNote.matchesTarget(targetNoteObj)
      const centsDeviation = detectedNote.centsDeviation
      const isInTune = Math.abs(centsDeviation) < 25

      // Record note attempt
      if (currentExercise && centsOff !== null) {
        const targetNote = currentExercise.notes[currentNoteIndex]
        useAnalyticsStore.getState().recordNoteAttempt(
          currentNoteIndex,
          targetNote.pitch,
          centsDeviation,
          isInTune
        )
      }

      if (isCorrectNote && isInTune) {
        const now = Date.now()
        const startTime = noteStartTime || now
        const holdTime = now - startTime

        if (holdTime >= requiredHoldTime) {
          set({
            state: "NOTE_COMPLETED",
            detectedPitch: pitch,
            confidence,
            isInTune: true,
            centsOff: centsDeviation,
            noteStartTime: startTime,
            holdDuration: holdTime,
          })

          setTimeout(() => {
            get().advanceToNextNote()
          }, 200)
        } else {
          set({
            state: "VALIDATING",
            detectedPitch: pitch,
            confidence,
            isInTune: true,
            centsOff: centsDeviation,
            noteStartTime: startTime,
            holdDuration: holdTime,
          })
        }
      } else {
        set({
          state: isCorrectNote ? "NOTE_DETECTED" : "PRACTICING",
          detectedPitch: pitch,
          confidence,
          isInTune: false,
          centsOff: isCorrectNote ? centsDeviation : null,
          noteStartTime: null,
          holdDuration: 0,
        })
      }
    } catch (_err) {
      set({
        state: "PRACTICING",
        noteStartTime: null,
        holdDuration: 0,
        detectedPitch: null,
        confidence: 0,
        isInTune: false,
        centsOff: null,
      })
    }
  },

  advanceToNextNote: () => {
    // Record note completion time
    const { currentExercise, currentNoteIndex, noteStartTime, completedNotes } = get()
    if (noteStartTime) {
      const timeToComplete = Date.now() - noteStartTime
      useAnalyticsStore.getState().recordNoteCompletion(
        currentNoteIndex,
        timeToComplete
      )
    }

    if (!currentExercise) return

    const newCompletedNotes = [...completedNotes]
    newCompletedNotes[currentNoteIndex] = true

    if (currentNoteIndex < currentExercise.notes.length - 1) {
      set({
        state: "PRACTICING",
        currentNoteIndex: currentNoteIndex + 1,
        completedNotes: newCompletedNotes,
        noteStartTime: null,
        holdDuration: 0,
        detectedPitch: null,
        confidence: 0,
        isInTune: false,
        centsOff: null,
      })
    } else {
      set({ completedNotes: newCompletedNotes })
      get().completeExercise()
    }
  },

  completeExercise: () => {
    // End analytics session
    useAnalyticsStore.getState().endSession()

    set({
      state: "EXERCISE_COMPLETE",
      noteStartTime: null,
      holdDuration: 0,
    })
  },
}))
