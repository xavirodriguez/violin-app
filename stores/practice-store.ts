/**
 * PracticeStore
 *
 * Managing the state of a violin practice session, including audio resources
 * and the real-time event pipeline consumption.
 */

'use client'

import { create } from 'zustand'
import { type PracticeState, reducePracticeEvent, formatPitchName } from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { useAnalyticsStore } from './analytics-store'
import { useTunerStore } from './tuner-store'
import { calculateLiveObservations } from '@/lib/live-observations'

import type { Exercise } from '@/lib/exercises/types'
import type { PracticeEvent } from '@/lib/practice-core'
import type { Observation } from '@/lib/technique-types'

interface PracticeStore {
  practiceState: PracticeState | null
  analyser: AnalyserNode | null
  detector: PitchDetector | null
  error: AppError | null
  liveObservations: Observation[]
  isStarting: boolean
  /** Whether exercises should start listening automatically upon loading. */
  autoStartEnabled: boolean
  /** The current session ID, used to prevent stale updates from previous loops. */
  sessionId: number
  /** Loads an exercise and prepares the store, stopping any active session. */
  loadExercise: (exercise: Exercise) => Promise<void>
  /** Toggles the auto-start feature. */
  setAutoStart: (enabled: boolean) => void
  /** Resets the current note to the previous one or specific index. */
  setNoteIndex: (index: number) => void
  /** Starts the audio pipeline and begins the pitch detection loop. */
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => void
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

const getInitialState = (exercise: Exercise): PracticeState => ({
  status: 'idle',
  exercise: exercise,
  currentIndex: 0,
  detectionHistory: [],
  perfectNoteStreak: 0,
})

export const usePracticeStore = create<PracticeStore>((set, get) => {
  // Private closure state to avoid global module contamination (SSR/Test safety)
  // Non-serializable resources stay in the closure, while primitives move to state.
  let practiceLoopController: AbortController | null = null

  return {
    practiceState: null,
    error: null,
    detector: null,
    analyser: null,
    liveObservations: [],
    isStarting: false,
    autoStartEnabled: false,
    sessionId: 0,

    loadExercise: async (exercise) => {
      // Always stop any existing session before loading a new exercise
      await get().stop()
      set(() => ({
        practiceState: getInitialState(exercise),
        error: null,
        liveObservations: [],
      }))
    },

    setAutoStart: (enabled) => set({ autoStartEnabled: enabled }),

    setNoteIndex: (index) => {
      set((state) => {
        if (!state.practiceState) return state
        return {
          practiceState: {
            ...state.practiceState,
            currentIndex: Math.max(0, Math.min(index, state.practiceState.exercise.notes.length - 1)),
            status: 'listening',
            holdDuration: 0,
            detectionHistory: [],
          },
        }
      })
    },

    start: async () => {
      // 1. Synchronous guards for concurrency: prevents double start and overlapping loops
      if (get().isStarting || get().practiceState?.status === 'listening') return

      const currentState = get().practiceState
      if (!currentState) {
        set({ error: toAppError('No exercise loaded') })
        return
      }

      set({ isStarting: true })

      try {
        // 2. Resource-first setup: Ensure any previous loops are stopped
        // (This increments sessionId, invalidating any pending async loops)
        await get().stop()

        const deviceId = useTunerStore.getState().deviceId
        const resources = await audioManager.initialize(deviceId ?? undefined)
        const detector = new PitchDetector(resources.context.sampleRate)

        const nextSessionId = get().sessionId + 1

        set({
          analyser: resources.analyser,
          detector,
          practiceState: reducePracticeEvent(currentState, { type: 'START' }),
          isStarting: false,
          sessionId: nextSessionId,
          error: null,
        })

        // Sync with TunerStore
        useTunerStore.setState({
          state: { kind: 'LISTENING', sessionToken: nextSessionId },
          detector,
        })
      } catch (error) {
        set({
          error: toAppError(error),
          isStarting: false,
        })
      }
    },

    stop: async () => {
      // 1. Resource-first cleanup: always abort and cleanup audio regardless of state
      if (practiceLoopController) {
        practiceLoopController.abort()
        practiceLoopController = null
      }

      try {
        await audioManager.cleanup()
      } catch (err) {
        console.warn('[PRACTICE STOP] Audio cleanup failed:', err)
      }

      // Invalidate current session to block any pending updates
      const nextSessionId = get().sessionId + 1

      // 2. Guarantee analytics closure
      try {
        const analyticsStore = useAnalyticsStore.getState()
        if (analyticsStore.currentSession) {
          analyticsStore.endSession()
        }
      } catch (err) {
        console.warn('[PRACTICE STOP] Analytics closure failed:', err)
      }

      set((state) => ({
        practiceState: state.practiceState
          ? reducePracticeEvent(state.practiceState, { type: 'STOP' })
          : null,
        analyser: null,
        detector: null,
        liveObservations: [],
        sessionId: nextSessionId,
        isStarting: false,
      }))
    },

    reset: () => {
      get().stop()
      set({
        practiceState: null,
        error: null,
        liveObservations: [],
      })
    },

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      const localSessionId = get().sessionId
      try {
        for await (const event of pipeline) {
          // Guard against stale sessions
          if (get().sessionId !== localSessionId) break

          const currentState = get().practiceState
          if (!currentState) break

          // Update state with pure reducer
          const newState = reducePracticeEvent(currentState, event)

          // Calculate live observations
          if (event.type === 'NOTE_DETECTED') {
            const targetNote = currentState.exercise.notes[currentState.currentIndex]
            if (targetNote) {
              const targetPitchName = formatPitchName(targetNote.pitch)
              const liveObs = calculateLiveObservations(
                [...newState.detectionHistory],
                targetPitchName
              )
              set({ liveObservations: liveObs })
            }
          }

          // Clear live observations on match
          if (event.type === 'NOTE_MATCHED') {
            set({ liveObservations: [] })
          }

          set({ practiceState: newState })

          if (newState.status === 'completed' && currentState.status !== 'completed') {
            console.log('[PracticeStore] Exercise completed!')
          }
        }
      } catch (error) {
        console.error('[PracticeStore] Pipeline consumption error:', error)
      }
    },
  }
})
