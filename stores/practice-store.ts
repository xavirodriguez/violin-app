/**
 * PracticeStore
 *
 * Managing the state of a violin practice session, including audio resources
 * and the real-time event pipeline consumption via SessionRunner.
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
import { runPracticeSession } from '@/lib/practice/session-runner'

import type { Exercise } from '@/lib/exercises/types'
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
  /** Consumes a stream of events, intended for testing or external pipelines. */
  consumePipelineEvents: (pipeline: AsyncIterable<import('@/lib/practice-core').PracticeEvent>) => Promise<void>
}

const getInitialState = (exercise: Exercise): PracticeState => ({
  status: 'idle',
  exercise: exercise,
  currentIndex: 0,
  detectionHistory: [],
  perfectNoteStreak: 0,
})

/**
 * Helper to calculate live observations based on the current practice state.
 * @internal
 */
const getUpdatedLiveObservations = (ps: PracticeState): Observation[] => {
  const targetNote = ps.exercise.notes[ps.currentIndex]
  if (targetNote && ps.detectionHistory.length > 0) {
    const targetPitchName = formatPitchName(targetNote.pitch)
    return calculateLiveObservations([...ps.detectionHistory], targetPitchName)
  }
  return []
}

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
      set((state) => ({
        ...state,
        practiceState: getInitialState(exercise),
        error: null,
        liveObservations: [],
      }))
    },

    setAutoStart: (enabled) => set((state) => ({ ...state, autoStartEnabled: enabled })),

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
      if (get().isStarting || get().practiceState?.status === 'listening') {
        return
      }

      const currentState = get().practiceState
      if (!currentState) {
        set((state) => ({ ...state, error: toAppError('No exercise loaded') }))
        return
      }

      // Indicate start process is in progress
      set((state) => ({ ...state, isStarting: true }))

      try {
        // 2. Resource-first setup: Ensure any previous loops are stopped
        // (This increments sessionId, invalidating any pending async loops)
        await get().stop()

        const deviceId = useTunerStore.getState().deviceId
        const resources = await audioManager.initialize(deviceId ?? undefined)
        const detector = new PitchDetector(resources.context.sampleRate)

        const nextSessionId = get().sessionId + 1
        const sessionStartTime = Date.now()

        set((state) => {
          if (!state.practiceState) return state
          return {
            ...state,
            analyser: resources.analyser,
            detector,
            practiceState: reducePracticeEvent(state.practiceState, { type: 'START' }),
            sessionId: nextSessionId,
            error: null,
            isStarting: false,
          }
        })

        // Sync with TunerStore
        useTunerStore.setState({
          state: { kind: 'LISTENING', sessionToken: nextSessionId },
          detector,
        })

        // Start Analytics
        useAnalyticsStore.getState().startSession(
          currentState.exercise.id,
          currentState.exercise.name,
          'practice'
        )

        // Launch the async loop (non-blocking)
        practiceLoopController = new AbortController()
        runPracticeSession({
          signal: practiceLoopController.signal,
          sessionId: nextSessionId,
          detector,
          exercise: currentState.exercise,
          sessionStartTime,
          store: {
            getState: () => get(),
            setState: (partial) => {
              // Safety guard: only apply updates if the session is still current
              if (get().sessionId !== nextSessionId) return

              set((state) => {
                // Re-verify session ID inside the set loop for atomicity
                if (state.sessionId !== nextSessionId) return state

                const next = typeof partial === 'function' ? partial(state) : partial
                if (!next.practiceState) return { ...state, ...next }

                // Inject abstracted live observations logic
                const ps = next.practiceState as PracticeState
                const liveObservations = getUpdatedLiveObservations(ps)

                return { ...state, ...next, liveObservations }
              })
            },
            stop: () => get().stop(),
          },
          analytics: {
            recordNoteAttempt: (index, pitch, cents, inTune) =>
              useAnalyticsStore.getState().recordNoteAttempt(index, pitch, cents, inTune),
            recordNoteCompletion: (index, time, technique) =>
              useAnalyticsStore.getState().recordNoteCompletion(index, time, technique),
            endSession: () => useAnalyticsStore.getState().endSession(),
          },
          updatePitch: (pitch, confidence) => {
            // Update TunerStore for visual feedback consistency
            useTunerStore.getState().updatePitch(pitch, confidence)
          }
        }).catch((err) => {
          const isAbort = err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
          if (!isAbort) {
            console.error('[PracticeStore] Session runner failed:', err)
            set((state) => ({ ...state, error: toAppError(err) }))
            get().stop()
          }
        })
      } catch (error) {
        set((state) => ({
          ...state,
          error: toAppError(error),
          isStarting: false,
        }))
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

      // 2. Guarantee analytics closure
      try {
        const analyticsStore = useAnalyticsStore.getState()
        if (analyticsStore.currentSession) {
          analyticsStore.endSession()
        }
      } catch (err) {
        console.warn('[PRACTICE STOP] Analytics closure failed:', err)
      }

      // Invalidate current session to block any pending updates
      const nextSessionId = get().sessionId + 1

      // 3. Unified state update
      set((state) => ({
        ...state,
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
      set((state) => ({
        ...state,
        practiceState: null,
        error: null,
        liveObservations: [],
      }))
    },

    consumePipelineEvents: async (pipeline) => {
      const currentSessionId = get().sessionId
      for await (const event of pipeline) {
        // Guard against session invalidation during processing
        if (get().sessionId !== currentSessionId) break

        if (!event || !event.type) {
          console.warn('[PIPELINE] Invalid event in consumePipelineEvents:', event)
          continue
        }

        const currentState = get().practiceState
        if (!currentState) {
          console.error('[PIPELINE] State null in consumePipelineEvents', { event })
          break
        }

        const newState = reducePracticeEvent(currentState, event)

        set((state) => {
          if (state.sessionId !== currentSessionId) return state
          if (!state.practiceState) return state

          // Use the same abstracted logic for live observations
          const liveObservations = getUpdatedLiveObservations(newState)

          return { ...state, practiceState: newState, liveObservations }
        })
      }
    },
  }
})
