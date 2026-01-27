/**
 * PracticeStore
 *
 * This module provides a Zustand store for managing the state of a violin practice session.
 * It handles exercise loading, audio resource management, and the real-time pitch detection loop.
 */

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

/**
 * Interface representing the state and actions of the practice store.
 *
 * @remarks
 * State machine:
 * - `idle` -\> `listening` when `start()` is called successfully.
 * - `listening` -\> `completed` when the exercise is finished.
 * - `any` -\> `idle` when `stop()` or `reset()` is called.
 *
 * Invariants:
 * - `practiceState.status === 'listening'` implies `audioContext` and `mediaStream` are initialized.
 */
interface PracticeStore {
  /** The core state of the practice session, managed by pure reducers. */
  practiceState: PracticeState | null

  /** Stores any error message encountered during audio setup or processing. */
  error: string | null

  /**
   * The index of the note currently being practiced.
   * @defaultValue 0
   */
  currentNoteIndex: number

  /** The note object that the student is currently expected to play. */
  targetNote: Exercise['notes'][0] | null

  /** The current status of the practice session (e.g., 'idle', 'listening', 'completed'). */
  status: PracticeState['status']

  /** The Web Audio API context used for processing. Managed by the store. */
  audioContext: AudioContext | null

  /** AnalyserNode for extracting frequency data. */
  analyser: AnalyserNode | null

  /** The media stream from the microphone. */
  mediaStream: MediaStream | null

  /** The pitch detection algorithm instance. */
  detector: PitchDetector | null

  /**
   * Loads a new exercise into the store and resets the state.
   * @param exercise - The exercise to load.
   */
  loadExercise: (exercise: Exercise) => void

  /**
   * Initializes audio resources and starts the real-time pitch detection loop.
   * @remarks
   * This is an asynchronous action that:
   * 1. Requests microphone access.
   * 2. Sets up the Web Audio graph.
   * 3. Transitions the state to 'listening'.
   * 4. Starts an analytics session.
   * 5. Runs the processing pipeline until aborted.
   *
   * @throws Will set the `error` state if audio hardware fails or permission is denied.
   */
  start: () => Promise<void>

  /**
   * Stops the practice loop and releases all audio resources.
   * @remarks
   * Idempotent. Safely handles closing the AudioContext and stopping media tracks.
   */
  stop: () => Promise<void>

  /**
   * Resets the entire store to its initial state and stops any active session.
   */
  reset: () => void
}

/**
 * Helper to get the initial state for a given exercise.
 * @param exercise - The exercise to initialize state for.
 */
const getInitialState = (exercise: Exercise): PracticeState => ({
  status: 'idle',
  exercise: exercise,
  currentIndex: 0,
  detectionHistory: [],
})

/**
 * Hook for accessing the practice store.
 */
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
        let lastDispatchedNoteIndex = -1
        let currentNoteStartedAt = Date.now()

        for await (const event of practiceEventPipeline) {
          // Session Guard: If the controller has changed, this loop is from a
          // stale session and must terminate.
          if (signal.aborted || practiceLoopController !== localController) break

          const currentState = get().practiceState
          if (!currentState) continue

          // Record note completion BEFORE handlePracticeEvent to ensure the final note
          // is captured before the session is potentially stopped/reset.
          if (event.type === 'NOTE_MATCHED') {
            const noteIndex = currentState.currentIndex
            const target = currentState.exercise.notes[noteIndex]

            // Guard to ensure each note completion is recorded only once.
            if (noteIndex !== lastDispatchedNoteIndex) {
              const timeToComplete = Date.now() - currentNoteStartedAt
              const analytics = useAnalyticsStore.getState()
              const targetPitch = `${target.pitch.step}${target.pitch.alter || ''}${target.pitch.octave}`

              // Record the final successful attempt and the full note completion.
              analytics.recordNoteAttempt(noteIndex, targetPitch, 0, true)
              analytics.recordNoteCompletion(noteIndex, timeToComplete)

              // Housekeeping: Track that this note has been dispatched.
              lastDispatchedNoteIndex = noteIndex
              currentNoteStartedAt = Date.now()
            }
          }

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
