/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing:
 * 1. FSM (State Machine) for the practice flow.
 * 2. Audio resources (Web Audio, Pitch Detection).
 * 3. Asynchronous runner loop.
 * 4. Analytics and progress tracking.
 *
 * Refactored to handle:
 * - Concurrency: Guards against double start and stale updates using sessionId.
 * - Resource Lifecycle: Resource-first cleanup in stop() to prevent leaks.
 * - Reactivity: analyser and detector are stored in state for UI consistency.
 */

'use client'

import { create } from 'zustand'
import { formatPitchName } from '@/lib/practice-core'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { calculateLiveObservations } from '@/lib/live-observations'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { PitchDetector } from '@/lib/pitch-detector'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { WebAudioFrameAdapter, WebAudioLoopAdapter, PitchDetectorAdapter } from '@/lib/adapters/web-audio.adapter'
import { useSessionStore } from './session.store'
import { useProgressStore } from './progress.store'
import { useTunerStore } from './tuner-store'
import { PracticeSessionRunnerImpl, runPracticeSession } from '@/lib/practice/session-runner'
import { handlePracticeEvent } from '@/lib/practice/practice-event-sink'
import { transitions, PracticeStoreState } from '@/lib/practice/practice-states'

import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'
import { PracticeState, PracticeEvent } from '@/lib/practice-core'

interface PracticeStore {
  // Explicit State
  state: PracticeStoreState

  // Backward compatibility properties (kept in state for easy access)
  practiceState: PracticeState | null
  error: AppError | null

  // Extra UI state
  liveObservations: Observation[]
  autoStartEnabled: boolean
  analyser: AnalyserNode | null
  audioLoop: AudioLoopPort | null
  detector: PitchDetectionPort | null

  // Concurrency and Resource Management
  isStarting: boolean
  sessionId: number

  // Actions
  loadExercise: (exercise: Exercise) => Promise<void>
  setAutoStart: (enabled: boolean) => void
  setNoteIndex: (index: number) => void
  initializeAudio: () => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => Promise<void>
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

export const usePracticeStore = create<PracticeStore>((set, get) => {
  return {
    state: { status: 'idle', exercise: null, error: null },
    practiceState: null,
    error: null,
    liveObservations: [],
    autoStartEnabled: false,
    isStarting: false,
    sessionId: 0,
    analyser: null,
    audioLoop: null,
    detector: null,

    loadExercise: async (exercise) => {
      await get().stop()
      set((state) => ({
        ...state,
        practiceState: getInitialState(exercise),
        error: null,
        liveObservations: []
      })
    },

    setAutoStart: (enabled) => set((state) => ({ ...state, autoStartEnabled: enabled })),

    setNoteIndex: (index) => {
      const { state } = get()
      if (state.status === 'active') {
        const newPracticeState: PracticeState = {
          ...state.practiceState,
          currentIndex: Math.max(0, Math.min(index, state.exercise.notes.length - 1)),
          status: 'listening',
          holdDuration: 0,
          detectionHistory: [],
        }
        set({
          state: {
            ...state,
            practiceState: newPracticeState
          },
          practiceState: newPracticeState
        })
      }
    },

    initializeAudio: async () => {
      const { state: currentState } = get()
      const exercise = 'exercise' in currentState ? currentState.exercise : null

      const currentState = get().practiceState
      if (!currentState) {
        set((state) => ({ ...state, error: toAppError('No exercise loaded') }))
        return
      }
    },

      // Indicate start process is in progress
      set((state) => ({ ...state, isStarting: true }))

      try {
        // 3. Auto-initialize if needed
        const currentStateAtStart = get().state
        if (currentStateAtStart.status === 'idle' && 'exercise' in currentStateAtStart && currentStateAtStart.exercise) {
          await get().initializeAudio()
        }

        const state = get().state

        if (state.status !== 'ready') {
          return
        }

        // 4. Create Safe Set with Session ID Validation
        const safeSet = (partial: any) => {
          if (get().sessionId !== newSessionId) return
          set((s) => {
            const newStateFromPartial = typeof partial === 'function' ? partial({ practiceState: s.practiceState }) : partial
            const nextPracticeState = newStateFromPartial.practiceState || s.practiceState
            const nextLiveObs = newStateFromPartial.liveObservations || s.liveObservations

            if (s.state.status === 'active') {
              return {
                state: { ...s.state, practiceState: nextPracticeState },
                practiceState: nextPracticeState,
                liveObservations: nextLiveObs
              }
            }
            return {
              practiceState: nextPracticeState,
              liveObservations: nextLiveObs
            }
          })
        }

        const runnerDeps = {
          audioLoop: state.audioLoop,
          detector: state.detector,
          exercise: state.exercise,
          sessionStartTime: Date.now(),
          store: {
            getState: () => ({ practiceState: get().practiceState }),
            setState: safeSet,
            stop: get().stop
          },
          analytics: {
            recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) =>
              useSessionStore.getState().recordAttempt(index, pitch, cents, inTune),
            recordNoteCompletion: (index: number, timeMs: number, technique?: any) =>
              useSessionStore.getState().recordCompletion(index, timeMs, technique),
            endSession: () => {
              const completed = useSessionStore.getState().end()
              if (completed) {
                useProgressStore.getState().addSession(completed)
              }
            }
          }
        }

        const runner = new PracticeSessionRunnerImpl(runnerDeps)
        const nextState = transitions.start(state, runner)

        // 5. Start Session in Analytics
        useSessionStore.getState().start(state.exercise.id, state.exercise.name)

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
          state: { kind: 'LISTENING', sessionToken: newSessionId },
          detector: (state as any).detector?.detector || null
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
      const { state } = get()

      // 1. Abort runner if active
      if (state.status === 'active') {
        state.runner.cancel()
      }

      // 2. Resource Cleanup (Resource-first)
      try {
        await audioManager.cleanup()
      } catch (err) {
        console.warn('[PracticeStore] Error during audio cleanup:', err)
      }

      // 3. Guaranteed Analytics closure
      const sessionStore = useSessionStore.getState()
      if (sessionStore.isActive || sessionStore.current) {
        const completed = sessionStore.end()
        if (completed) {
          useProgressStore.getState().addSession(completed)
        }
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

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      const currentSessionId = get().sessionId

      for await (const event of pipeline) {
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

        if (event.type === 'NOTE_DETECTED') {
          const practiceState = get().practiceState
          if (practiceState) {
            const targetNote = practiceState.exercise.notes[practiceState.currentIndex]
            if (targetNote) {
              const targetPitchName = formatPitchName(targetNote.pitch)
              const liveObs = calculateLiveObservations(
                [...practiceState.detectionHistory],
                targetPitchName
              )
              if (get().sessionId === currentSessionId) {
                set({ liveObservations: liveObs })
              }
            }
          }
        } else if (event.type === 'NOTE_MATCHED') {
          if (get().sessionId === currentSessionId) {
            set({ liveObservations: [] })
          }
        }
      }
    }
  }
})
