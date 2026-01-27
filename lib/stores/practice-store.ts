import { create } from 'zustand'
import { type PracticeState, reducePracticeEvent } from '@/lib/practice-core'
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'
import { PitchDetector } from '@/lib/pitch-detector'
import { useAnalyticsStore } from './analytics-store'
import { handlePracticeEvent } from '../practice/practice-event-sink'

import type { Exercise } from '@/lib/exercises/types'

// The AbortController is stored in the closure of the store, not in the Zustand
// state itself, as it's not a piece of data we want to serialize or subscribe to.
let practiceLoopController: AbortController | null = null

interface PracticeStore {
  // --- STATE ---
  // The entire state from the pure functional core
  practiceState: PracticeState | null
  error: string | null

  // --- DERIVED STATE ---
  // Convenience getters for the UI
  currentNoteIndex: number
  targetNote: Exercise['notes'][0] | null
  status: PracticeState['status']

  // --- AUDIO RESOURCES ---
  // Managed by the store, but not part of the core logic state
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  mediaStream: MediaStream | null
  detector: PitchDetector | null

  // --- ACTIONS ---
  loadExercise: (exercise: Exercise) => void
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

const getInitialState = (exercise: Exercise): PracticeState => ({
  status: 'idle',
  exercise: exercise,
  currentIndex: 0,
  detectionHistory: [],
})

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  // --- INITIAL STATE ---
  practiceState: null,
  error: null,
  audioContext: null,
  analyser: null,
  mediaStream: null,
  detector: null,

  // --- DERIVED STATE GETTERS ---
  get currentNoteIndex() {
    return get().practiceState?.currentIndex ?? 0
  },
  get targetNote() {
    const state = get().practiceState
    if (!state) return null
    return state.exercise.notes[state.currentIndex] ?? null
  },
  get status() {
    return get().practiceState?.status ?? 'idle'
  },

  // --- ACTIONS ---
  loadExercise: (exercise) => {
    get().stop()
    set({
      practiceState: getInitialState(exercise),
      error: null,
    })
  },

  start: async () => {
    if (get().practiceState?.status === 'listening') return
    if (!get().practiceState) {
      set({ error: 'No exercise loaded.' })
      return
    }

    // Ensure any previous session is stopped before starting a new one.
    get().stop()

    practiceLoopController = new AbortController()
    const signal = practiceLoopController.signal

    try {
      // 1. Setup audio resources
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      source.connect(analyser)
      const detector = new PitchDetector(context.sampleRate)
      set({ audioContext: context, analyser, mediaStream: stream, detector, error: null })

      // 2. Transition state to 'listening' and start analytics session
      const currentState = get().practiceState!
      set({ practiceState: reducePracticeEvent(currentState, { type: 'START' }) })
      useAnalyticsStore
        .getState()
        .startSession(currentState.exercise.id, currentState.exercise.name, 'practice')

      // 3. Create and consume the event pipeline
      const rawPitchStream = createRawPitchStream(analyser, detector, () => !signal.aborted)
      const practiceEventPipeline = createPracticeEventPipeline(
        rawPitchStream,
        () => get().targetNote,
      )

      // 4. Start processing the pipeline in a non-blocking way
      ;(async () => {
        for await (const event of practiceEventPipeline) {
          if (signal.aborted) break
          handlePracticeEvent(event, { getState: get, setState: set }, () => get().stop())
        }
      })().catch((err) => {
        if (err.name !== 'AbortError') {
          set({ error: err instanceof Error ? err.message : 'An unexpected error occurred.' })
        }
        get().stop()
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Audio hardware error.' })
      get().stop()
    }
  },

  stop: () => {
    practiceLoopController?.abort()
    practiceLoopController = null

    get()
      .mediaStream?.getTracks()
      .forEach((track) => track.stop())
    get().audioContext?.close()

    const currentState = get().practiceState
    if (currentState && currentState.status !== 'idle') {
      set({ practiceState: reducePracticeEvent(currentState, { type: 'STOP' }) })
    }

    set({ audioContext: null, analyser: null, mediaStream: null })
  },

  reset: () => {
    get().stop()
    set({ practiceState: null, error: null })
  },
}))
