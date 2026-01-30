/**
 * PracticeStore
 *
 * This module provides a Zustand store for managing the state of a violin practice session.
 * It handles exercise loading, audio resource management, and the real-time pitch detection loop.
 */

'use client'

import { create } from 'zustand'
import { type PracticeState, reducePracticeEvent } from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { type AppError, toAppError, ERROR_CODES } from '@/lib/errors/app-error'
import { useAnalyticsStore } from './analytics-store'
import { runPracticeSession } from '@/lib/practice/session-runner'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { useTunerStore } from './tuner-store'

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
  error: AppError | null
  analyser: AnalyserNode | null
  detector: PitchDetector | null
  isStarting: boolean
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
  analyser: null,
  isStarting: false,

  loadExercise: async (exercise) => {
    await get().stop()
    set(() => ({
      practiceState: getInitialState(exercise),
      error: null,
    }))
  },

  start: async () => {
    // 1. Sincronic guards for concurrency and state
    const current = get()
    if (current.isStarting || current.practiceState?.status === 'listening') return

    if (!current.practiceState) {
      set(() => ({
        error: toAppError('No exercise loaded.', ERROR_CODES.STATE_INVALID_TRANSITION),
      }))
      return
    }

    set(() => ({ isStarting: true, error: null }))

    try {
      // 2. Kill any existing session before starting new one
      await get().stop()

      sessionId += 1
      const localSessionId = sessionId
      practiceLoopController = new AbortController()
      const signal = practiceLoopController.signal

      // 3. Resource initialization
      const tunerState = useTunerStore.getState()
      const { context } = await audioManager.initialize(tunerState.deviceId ?? undefined)

      // Apply sensitivity from tuner store
      audioManager.setGain(tunerState.sensitivity / 50)

      const detector = new PitchDetector(context.sampleRate)
      detector.setMaxFrequency(2700)
      const analyser = audioManager.getAnalyser()

      const initialState = get().practiceState!
      const listeningState = reducePracticeEvent(initialState, { type: 'START' })

      // 4. Update state to listening
      set(() => ({
        detector,
        analyser,
        practiceState: listeningState,
        isStarting: false,
      }))

      // Sync with TunerStore
      useTunerStore.setState({
        detector,
        state: { kind: 'LISTENING', sessionToken: sessionId },
      })

      const sessionStartTime = Date.now()
      const { exercise } = get().practiceState!
      const analyticsStore = useAnalyticsStore.getState()
      analyticsStore.startSession(exercise.id, exercise.name, 'practice')

      // 5. Session-guarded setState wrapper for the runner
      const guardedSetState: typeof set = (updater) => {
        if (sessionId !== localSessionId) {
          console.warn('[PIPELINE] Stale session update ignored', {
            sessionId,
            localSessionId,
          })
          return
        }
        set(updater)
      }

      runPracticeSession({
        signal,
        sessionId: localSessionId,
        updatePitch: useTunerStore.getState().updatePitch,
        store: {
          getState: get,
          setState: guardedSetState,
          stop: async () => {
            if (sessionId === localSessionId) {
              await get().stop()
            }
          },
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
        if (name !== 'AbortError' && sessionId === localSessionId) {
          const appError = toAppError(err, ERROR_CODES.UNKNOWN)
          console.error('[PRACTICE LOOP ERROR]', appError)
          set(() => ({ error: appError }))
          void get().stop()
        }
      })
    } catch (err) {
      const appError = toAppError(err, ERROR_CODES.MIC_GENERIC_ERROR)
      console.error('[PRACTICE START ERROR]', appError)
      set(() => ({ error: appError, isStarting: false }))
      void get().stop()
    }
  },

  stop: async () => {
    // 1. Resource cleanup (always, regardless of state)
    if (practiceLoopController) {
      practiceLoopController.abort()
      practiceLoopController = null
    }

    try {
      await audioManager.cleanup()
    } catch (err) {
      console.warn('[PRACTICE STOP] Audio cleanup failed:', err)
    }

    // 2. Guarantee analytics closure
    const analyticsStore = useAnalyticsStore.getState()
    if (analyticsStore.currentSession) {
      analyticsStore.endSession()
    }

    // 3. Unified state update
    set((state) => ({
      practiceState:
        state.practiceState && state.practiceState.status !== 'idle'
          ? reducePracticeEvent(state.practiceState, { type: 'STOP' })
          : state.practiceState,
      detector: null,
      analyser: null,
      isStarting: false,
    }))
  },

  reset: async () => {
    await get().stop()
    set(() => ({ practiceState: null, error: null }))
  },
}))
