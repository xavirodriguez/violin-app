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
import { PitchDetectionPort } from '@/lib/ports/audio.port'

interface PracticeStore {
  // Explicit State
  state: PracticeStoreState

  // Backward compatibility properties (kept in state for easy access)
  practiceState: PracticeState | null
  error: AppError | null

  // Extra UI state
  liveObservations: Observation[]
  autoStartEnabled: boolean

  // Concurrency and Resource Management
  isStarting: boolean
  sessionId: number
  analyser: AnalyserNode | null
  detector: PitchDetectionPort | null

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
    detector: null,

    loadExercise: async (exercise) => {
      await get().stop()

      const newState = transitions.selectExercise(exercise)

      set({
        state: newState,
        practiceState: { exercise, status: 'idle', currentIndex: 0, detectionHistory: [], perfectNoteStreak: 0 },
        error: null,
        liveObservations: []
      })
    },

    setAutoStart: (enabled) => set({ autoStartEnabled: enabled }),

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
      const exercise = (currentState as any).exercise

      set({ state: transitions.initialize(exercise) })
      try {
        const { deviceId, sensitivity } = useTunerStore.getState()
        const { analyser } = await audioManager.initialize(deviceId ?? undefined)
        audioManager.setGain(sensitivity / 50)

        const frameAdapter = new WebAudioFrameAdapter(analyser)
        const loopAdapter = new WebAudioLoopAdapter(frameAdapter)
        const detector = new PitchDetector(analyser.context.sampleRate)
        const detectorPort = new PitchDetectorAdapter(detector)

        if (exercise) {
          const newState = transitions.ready({
            audioLoop: loopAdapter,
            detector: detectorPort,
            exercise
          })
          set({
            state: newState,
            practiceState: { exercise, status: 'idle', currentIndex: 0, detectionHistory: [], perfectNoteStreak: 0 },
            analyser,
            detector: detectorPort,
            error: null
          })
        } else {
          const error = toAppError('No exercise selected')
          set({
            state: transitions.error(error),
            error,
            analyser: null,
            detector: null
          })
        }
      } catch (error) {
        console.error('[PracticeStore] initializeAudio error:', error)
        if (error instanceof Error) {
           console.error('Stack:', error.stack)
        }
        const appError = toAppError(error)
        set({
          state: transitions.error(appError),
          error: appError,
          analyser: null,
          detector: null
        })
      }
    },

    start: async () => {
      // 1. Synchronous Guard
      const { isStarting, state: currentState } = get()
      if (isStarting || currentState.status === 'active') return

      // 2. Increment Session & Set starting flag
      const newSessionId = get().sessionId + 1
      set({ isStarting: true, sessionId: newSessionId })

      try {
        // 3. Auto-initialize if needed
        if (get().state.status === 'idle' && get().state.exercise) {
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
        useSessionStore.getState().start(state.exercise.id, state.exercise.title)

        set({
          state: nextState,
          practiceState: nextState.practiceState
        })

        // Sync with TunerStore
        useTunerStore.setState({
          state: { kind: 'LISTENING', sessionToken: newSessionId },
          detector: (state as any).detector?.detector || null
        })

        // Fire and forget the runner
        runPracticeSession(runnerDeps as any).then(() => {
          if (get().sessionId !== newSessionId) return
          const s = get().state
          if (s.status === 'active' && s.runner === runner) {
            const stoppedState = transitions.stop(s)
            set({
              state: stoppedState,
              practiceState: { ...s.practiceState, status: 'idle' }
            })
          }
        })
      } finally {
        set({ isStarting: false })
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

      // 4. Unified State Update (Idempotent)
      set((s) => {
        // Transition FSM to idle since resources are cleaned up
        const nextState = s.state.exercise
          ? transitions.selectExercise(s.state.exercise)
          : transitions.reset()

        // Update domain practiceState (reduce STOP)
        let nextPracticeState = s.practiceState
        if (nextPracticeState && nextPracticeState.status !== 'completed') {
          nextPracticeState = { ...nextPracticeState, status: 'idle' }
        }

        return {
          state: nextState,
          practiceState: nextPracticeState,
          analyser: null,
          detector: null,
          isStarting: false,
          liveObservations: []
        }
      })
    },

    reset: async () => {
      await get().stop()
      set({
        state: transitions.reset(),
        practiceState: null,
        error: null,
        liveObservations: []
      })
    },

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      const currentSessionId = get().sessionId

      for await (const event of pipeline) {
        if (get().sessionId !== currentSessionId) break

        handlePracticeEvent(
          event,
          {
            getState: () => ({ practiceState: get().practiceState }),
            setState: (partial: any) => {
              if (get().sessionId !== currentSessionId) return
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
          },
          () => void get().stop(),
          {
            endSession: () => {
              const completed = useSessionStore.getState().end()
              if (completed) {
                useProgressStore.getState().addSession(completed)
              }
            }
          }
        )

        if (event.type === 'NOTE_DETECTED') {
          const practiceState = get().practiceState
          if (practiceState) {
            const targetNote = practiceState.exercise.notes[practiceState.currentIndex]
            if (targetNote) {
              const targetPitchName = formatPitchName(targetNote.pitch)
              const liveObs = calculateLiveObservations(
                practiceState.detectionHistory,
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
