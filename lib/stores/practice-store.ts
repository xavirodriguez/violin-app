import { create } from 'zustand'
import {
  type PracticeState,
  type PracticeEvent,
  reducePracticeEvent,
} from '@/lib/practice-core'
import {
  createRawPitchStream,
  createPracticeEventPipeline,
} from '@/lib/note-stream'
import { PitchDetector } from '@/lib/pitch-detector'
import { useAnalyticsStore } from './analytics-store'
import { allExercises } from '@/lib/exercises' // For default exercise

import type { Exercise } from '@/lib/exercises/types'

// A flag to control the audio processing loop
let isPracticing = false

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
  history: [],
  validationStartTime: null,
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
    const { practiceState } = get()
    if (!practiceState) {
      set({ error: 'No exercise loaded' })
      return
    }

    // Prevent starting if already practicing
    if (isPracticing) {
      console.warn('Practice is already in progress.')
      return
    }
    isPracticing = true

    // Start analytics session
    useAnalyticsStore
      .getState()
      .startSession(practiceState.exercise.id, practiceState.exercise.name, 'practice')

    try {
      // --- 1. SETUP AUDIO HARDWARE & DISPATCH START EVENT ---
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      const source = context.createMediaStreamSource(stream)
      source.connect(analyser)
      const detector = new PitchDetector(context.sampleRate)

      set({ audioContext: context, analyser, mediaStream: stream, detector })

      // Dispatch the START event to the reducer to transition state to 'listening'
      const startEvent: PracticeEvent = { type: 'START' }
      const initialPracticeState = get().practiceState!
      const startedState = reducePracticeEvent(initialPracticeState, startEvent)
      set({ practiceState: startedState })

      // --- 2. CREATE THE EVENT PIPELINE ---
      const rawPitchStream = createRawPitchStream(
        analyser,
        detector,
        () => isPracticing,
      )
      const practiceEventPipeline = createPracticeEventPipeline(rawPitchStream)

      // --- 3. CONSUME THE PIPELINE ---
      for await (const event of practiceEventPipeline) {
        if (!isPracticing) break

        const currentState = get().practiceState!
        const newState = reducePracticeEvent(currentState, event)

        // --- 4. UPDATE STATE & HANDLE SIDE EFFECTS ---
        if (newState !== currentState) {
          set({ practiceState: newState })

          // Side Effect: Record analytics on state change
          if (
            newState.status === 'validating' &&
            currentState.status === 'listening'
          ) {
            const target = currentState.exercise.notes[currentState.currentIndex]
            // This is a rough approximation. Analytics would need richer events.
            if (event.type === 'NOTE_DETECTED') {
              useAnalyticsStore
                .getState()
                .recordNoteAttempt(
                  currentState.currentIndex,
                  target.pitch,
                  event.payload.cents,
                  true,
                )
            }
          }

          // Side Effect: If a note was just marked 'correct', immediately
          // transition to 'listening' for the next note.
          if (newState.status === 'correct') {
            const finalState = { ...newState, status: 'listening' as const }
            set({ practiceState: finalState })
          }

          // Side Effect: On exercise completion
          if (newState.status === 'completed') {
            get().stop() // Stop the loop and cleanup
            useAnalyticsStore.getState().endSession()
            break // Exit the loop
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Audio initialization failed'
      set({ error: errorMessage })
      isPracticing = false
    }
  },

  stop: () => {
    if (!isPracticing && !get().mediaStream) return // Nothing to stop

    isPracticing = false
    const { mediaStream, audioContext } = get()

    mediaStream?.getTracks().forEach((track) => track.stop())
    audioContext?.close()

    // Dispatch a STOP event to reset the state machine
    const currentState = get().practiceState
    if (currentState) {
      const stoppedState = reducePracticeEvent(currentState, { type: 'STOP' })
      set({ practiceState: stoppedState })
    }

    set({
      audioContext: null,
      analyser: null,
      mediaStream: null,
      detector: null,
    })
  },

  reset: () => {
    get().stop()
    set({ practiceState: null, error: null })
  },
}))
