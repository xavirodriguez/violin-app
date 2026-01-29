/**
 * PracticeStore
 *
 * This module provides a Zustand store for managing the state of a violin practice session.
 * It handles exercise loading, audio resource management, and the real-time pitch detection loop.
 */

import { create } from 'zustand'
import { type PracticeState, reducePracticeEvent } from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { useAnalyticsStore } from './analytics-store'
import { runPracticeSession } from '@/lib/practice/session-runner'
import { audioManager } from '@/lib/infrastructure/audio-manager'

import type { Exercise } from '@/lib/exercises/types'

// The AbortController is stored in the closure of the store, not in the Zustand
// state itself, as it's not a piece of data we want to serialize or subscribe to.
let practiceLoopController: AbortController | null = null
let sessionId = 0

/**
 * Interface representing the state and actions of the practice store.
 */
interface PracticeStore {
  practiceState: PracticeState | null
  error: string | null
  currentNoteIndex: number
  targetNote: Exercise['notes'][0] | null
  status: PracticeState['status']
  analyser: AnalyserNode | null
  detector: PitchDetector | null
  loadExercise: (exercise: Exercise) => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => Promise<void>
}

const getInitialState = (exercise: Exercise): PracticeState => ({
  status: 'idle',
  exercise: exercise,
  currentIndex: 0,
  detectionHistory: [],
})

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practiceState: null,
  error: null,
  detector: null,

  get analyser() {
    return audioManager.getAnalyser()
  },

  /**
   * @remarks
   * This is a derived value. Using it directly in a component will cause the component
   * to re-render on any state change. For performance-critical components, prefer
   * a selector with `useShallow`.
   */
  get currentNoteIndex() {
    return get().practiceState?.currentIndex ?? 0
  },
  /**
   * @remarks
   * This is a derived value. Using it directly in a component will cause the component
   * to re-render on any state change. For performance-critical components, prefer
   * a selector with `useShallow`.
   */
  get targetNote() {
    const state = get().practiceState
    if (!state) return null
    return state.exercise.notes[state.currentIndex] ?? null
  },
  /**
   * @remarks
   * This is a derived value. Using it directly in a component will cause the component
   * to re-render on any state change. For performance-critical components, prefer
   * a selector with `useShallow`.
   */
  get status() {
    return get().practiceState?.status ?? 'idle'
  },

  loadExercise: async (exercise) => {
    await get().stop()
    set(() => ({
      practiceState: getInitialState(exercise),
      error: null,
    }))
  },

  start: async () => {
    if (get().practiceState?.status === 'listening') return
    if (!get().practiceState) {
      set(() => ({ error: 'No exercise loaded.' }))
      return
    }

    await get().stop()

    sessionId += 1
    practiceLoopController = new AbortController()
    const signal = practiceLoopController.signal

    try {
      const { context } = await audioManager.initialize()
      const detector = new PitchDetector(context.sampleRate)
      detector.setMaxFrequency(2700)
      set(() => ({ detector, error: null }))

      const initialState = get().practiceState!
      const listeningState = reducePracticeEvent(initialState, { type: 'START' })
      set(() => ({ practiceState: listeningState }))

      const sessionStartTime = Date.now()
      const { exercise } = get().practiceState!
      const analyticsStore = useAnalyticsStore.getState()
      analyticsStore.startSession(exercise.id, exercise.name, 'practice')

      runPracticeSession({
        signal,
        sessionId,
        store: {
          getState: get,
          setState: set,
          stop: get().stop,
        },
        analytics: {
          recordNoteAttempt: analyticsStore.recordNoteAttempt,
          recordNoteCompletion: analyticsStore.recordNoteCompletion,
          endSession: analyticsStore.endSession,
        },
        detector,
        exercise,
        sessionStartTime,
      }).catch((err) => {
        const name = err instanceof Error ? err.name : ''
        if (name !== 'AbortError') {
          console.error('[PRACTICE LOOP ERROR]', err)
          set(() => ({
            error:
              err instanceof Error
                ? err.message
                : 'An unexpected error occurred in the practice loop.',
          }))
        }
        void get().stop()
      })
    } catch (err) {
      console.error('[PRACTICE START ERROR]', err)
      set(() => ({ error: err instanceof Error ? err.message : 'Audio hardware error.' }))
      void get().stop()
    }
  },

  stop: async () => {
    if (get().practiceState?.status === 'idle') {
      return
    }
    if (practiceLoopController) {
      practiceLoopController.abort()
      practiceLoopController = null
    }

    await audioManager.cleanup()

    set((state) => {
      if (!state.practiceState || state.practiceState.status === 'idle') return state
      return { practiceState: reducePracticeEvent(state.practiceState, { type: 'STOP' }) }
    })

    set(() => ({
      detector: null,
    }))
  },

  reset: async () => {
    await get().stop()
    set(() => ({ practiceState: null, error: null }))
  },
}))
