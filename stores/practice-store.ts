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

/**
 * Interface representing the state and actions of the practice store.
 */
interface PracticeStore {
  /** The current domain state of the practice session. */
  practiceState: PracticeState | null
  /** Any application-level error that occurred during the session. */
  error: AppError | null
  /**
   * The active Web Audio AnalyserNode.
   * @remarks
   * Stored in state to provide reactivity for UI components (e.g., visualizers).
   * Unlike a getter, this ensures subscribers are notified when the audio pipeline is ready.
   */
  analyser: AnalyserNode | null
  /** The current pitch detector instance. */
  detector: PitchDetector | null
  /** True if the session is in the middle of an asynchronous startup sequence. */
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
  /** Stops the session, cleans up resources, and guarantees analytics closure. */
  stop: () => Promise<void>
  /** Resets the store to its initial state. */
  reset: () => Promise<void>
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
    isStarting: false,
    autoStartEnabled: false,
    sessionId: 0,

    loadExercise: async (exercise) => {
      // Always stop any existing session before loading a new exercise
      await get().stop()
      set(() => ({
        practiceState: getInitialState(exercise),
        error: null,
      }))
    },

    start: async () => {
      // 1. Synchronous guards for concurrency: prevents double start and overlapping loops
      if (get().isStarting || get().practiceState?.status === 'listening') return

      if (!get().practiceState) {
        set({
          error: toAppError('No exercise loaded.', ERROR_CODES.STATE_INVALID_TRANSITION),
        })
        return
      }

      set({ isStarting: true, error: null })

      let localSessionId: number | null = null

      try {
        // 2. Resource-first cleanup: kill any existing session/loop
        // stop() already increments sessionId, so we don't need another increment here.
        await get().stop()

        // Re-lock isStarting since stop() sets it to false
        set({ isStarting: true })

        localSessionId = get().sessionId
        practiceLoopController = new AbortController()
        const signal = practiceLoopController.signal

        // 3. Audio resource initialization
        const tunerState = useTunerStore.getState()
        const { context } = await audioManager.initialize(tunerState.deviceId ?? undefined)

        // Post-await check: has the session been aborted or superseded?
        if (signal.aborted || get().sessionId !== localSessionId) {
          set((state) => {
            if (state.sessionId !== localSessionId) return state
            return { isStarting: false }
          })
          return
        }

        // Apply sensitivity from tuner store
        audioManager.setGain(tunerState.sensitivity / 50)

        const detector = new PitchDetector(context.sampleRate)
        detector.setMaxFrequency(2700)
        const analyser = audioManager.getAnalyser()

        const initialState = get().practiceState!
        const listeningState = reducePracticeEvent(initialState, { type: 'START' })

        // 4. Atomic state update to transition to listening mode
        let updateCommitted = false
        set((state) => {
          // Final check before committing state changes
          if (state.sessionId !== localSessionId) {
            console.warn('[PIPELINE] Session superseded before listening transition', {
              local: localSessionId,
              current: state.sessionId,
            })
            return state
          }

          updateCommitted = true
          return {
            detector,
            analyser,
            practiceState: listeningState,
            isStarting: false,
          }
        })

        if (!updateCommitted) {
          console.warn('[PIPELINE] Aborting start: Session superseded during initialization', {
            localSessionId,
          })
          return
        }

        // Sync with TunerStore
        useTunerStore.setState({
          detector,
          state: { kind: 'LISTENING', sessionToken: localSessionId },
        })

        const sessionStartTime = Date.now()
        const { exercise } = get().practiceState!
        const analyticsStore = useAnalyticsStore.getState()
        analyticsStore.startSession(exercise.id, exercise.name, 'practice')

        // 5. Session-guarded setState wrapper for the runner to avoid stale updates
        // This ensures the asynchronous loop only updates the session it belongs to.
        const guardedSetState: typeof set = (updater) => {
          set((state) => {
            if (state.sessionId !== localSessionId) {
              console.warn('[PIPELINE] Stale session update ignored', {
                current: state.sessionId,
                local: localSessionId,
              })
              return state
            }

            if (!state.practiceState) {
              console.error('[STATE NULL]', { sessionId: localSessionId })
              return state
            }

            // Support both functional and object updaters
            const nextState = typeof updater === 'function' ? updater(state) : updater
            return { ...state, ...nextState }
          })
        }

        runPracticeSession({
          signal,
          sessionId: localSessionId,
          updatePitch: useTunerStore.getState().updatePitch,
          store: {
            getState: get,
            setState: guardedSetState,
            stop: async () => {
              if (get().sessionId === localSessionId) {
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
          if (name !== 'AbortError' && get().sessionId === localSessionId) {
            const appError = toAppError(err, ERROR_CODES.UNKNOWN)
            console.error('[PRACTICE LOOP ERROR]', appError)
            set((state) => {
              if (state.sessionId !== localSessionId) return state
              return { error: appError }
            })
            void get().stop()
          }
        })
      } catch (err) {
        const appError = toAppError(err, ERROR_CODES.MIC_GENERIC_ERROR)
        console.error('[PRACTICE START ERROR]', appError)

        // Ensure state is cleaned up on error
        if (localSessionId !== null) {
          set((state) => {
            if (state.sessionId !== localSessionId) return state
            return { error: appError, isStarting: false }
          })
        } else {
          set({ error: appError, isStarting: false })
        }

        void get().stop()
      }
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

      // 3. Unified state update (idempotent and atomic)
      set((state) => ({
        practiceState:
          state.practiceState && state.practiceState.status !== 'idle'
            ? reducePracticeEvent(state.practiceState, { type: 'STOP' })
            : state.practiceState,
        detector: null,
        analyser: null,
        isStarting: false,
        sessionId: nextSessionId,
      }))
    },

    reset: async () => {
      // Full cleanup: stop audio, loops, and reset domain state
      await get().stop()
      set(() => ({
        practiceState: null,
        error: null,
      }))
    },
  }
})
