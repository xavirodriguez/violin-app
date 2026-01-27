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
  stop: () => Promise<void>
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
  /**
   * @remarks
   * These getters provide derived state from the core `practiceState`.
   * They use the `get()` function from the Zustand store to access the latest
   * state. This pattern is convenient for co-locating derived state logic
   * within the store itself.
   *
   * However, components using these getters directly will re-render whenever
   * *any* part of the store's state changes, not just the derived value they
   * depend on. For performance-critical components, it is recommended to use a
   * selector with `useShallow` in the component to subscribe only to specific
   * state changes.
   *
   * Example:
   * `const status = usePracticeStore((state) => state.status)`
   */
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
    void get().stop()
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
    await get().stop()

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
      const initialState = get().practiceState!
      const listeningState = reducePracticeEvent(initialState, { type: 'START' })
      set({ practiceState: listeningState })

      // Start analytics with the guaranteed "listening" state.
      useAnalyticsStore
        .getState()
        .startSession(listeningState.exercise.id, listeningState.exercise.name, 'practice')

      // 3. Create and consume the event pipeline
      const rawPitchStream = createRawPitchStream(analyser, detector, () => !signal.aborted)
      const practiceEventPipeline = createPracticeEventPipeline(
        rawPitchStream,
        () => get().targetNote,
      )

      // 4. Start processing the pipeline in a non-blocking way
      ;(async () => {
        const localController = practiceLoopController
        for await (const event of practiceEventPipeline) {
          // Session Guard: If the controller has changed, this loop is from a
          // stale session and must terminate.
          if (signal.aborted || practiceLoopController !== localController) break

          handlePracticeEvent(event, { getState: get, setState: set }, () => void get().stop())
        }
      })().catch((err) => {
        // Gracefully handle session terminations. AbortErrors are expected
        // when `stop()` is called, and they should not be surfaced as user-facing errors.
        const isAbortError = err instanceof Error && err.name === 'AbortError'
        if (!isAbortError) {
          set({
            error: err instanceof Error ? err.message : 'An unexpected error occurred in the practice loop.',
          })
        }
        void get().stop()
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Audio hardware error.' })
      void get().stop()
    }
  },

  stop: async () => {
    // Abort any active practice loop.
    if (practiceLoopController) {
      practiceLoopController.abort()
      practiceLoopController = null
    }

    const { mediaStream, audioContext } = get()

    // Gracefully stop all media tracks.
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }

    // Gracefully close the audio context.
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close()
    }

    // Dispatch a STOP event only if the session is active.
    const currentState = get().practiceState
    if (currentState && currentState.status !== 'idle') {
      set({ practiceState: reducePracticeEvent(currentState, { type: 'STOP' }) })
    }

    // Reset all audio-related resources in the state.
    set({
      audioContext: null,
      analyser: null,
      mediaStream: null,
      detector: null, // Ensure detector is cleaned up
    })
  },

  reset: () => {
    void get().stop()
    set({ practiceState: null, error: null })
  },
}))
