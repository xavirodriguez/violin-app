/**
 * PracticeStore
 *
 * Managing the state of a violin practice session using explicit states.
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
import { PracticeState } from '@/lib/practice-core'

interface PracticeStore {
  // Explicit State
  state: PracticeStoreState

  // Backward compatibility properties (kept in state for easy access)
  practiceState: PracticeState | null
  error: AppError | null

  // Extra UI state
  liveObservations: Observation[]
  autoStartEnabled: boolean

  // Actions
  loadExercise: (exercise: Exercise) => Promise<void>
  setAutoStart: (enabled: boolean) => void
  setNoteIndex: (index: number) => void
  initializeAudio: () => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => void
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

export const usePracticeStore = create<PracticeStore>((set, get) => {
  return {
    state: { status: 'idle', exercise: null, error: null },
    practiceState: null,
    error: null,
    liveObservations: [],
    autoStartEnabled: false,

    loadExercise: async (exercise) => {
      await get().stop()
      const { state } = get()

      let newState: PracticeStoreState
      if (state.status === 'ready' || state.status === 'active') {
         newState = transitions.ready({
           audioLoop: (state as any).audioLoop,
           detector: (state as any).detector,
           exercise
         })
      } else {
        newState = transitions.selectExercise(exercise)
      }

      set({
        state: newState,
        practiceState: { exercise, status: 'idle', currentIndex: 0, detectionHistory: [], perfectNoteStreak: 0 },
        error: null
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
            error: null
          })
        } else {
          const error = toAppError('No exercise selected')
          set({ state: transitions.error(error), error })
        }
      } catch (error) {
        console.error('[PracticeStore] initializeAudio error:', error)
        const appError = toAppError(error)
        set({ state: transitions.error(appError), error: appError })
      }
    },

    start: async () => {
      let { state } = get()

      if (state.status === 'idle' && state.exercise) {
        await get().initializeAudio()
        state = get().state
      }

      if (state.status !== 'ready') return

      const runnerDeps = {
        audioLoop: state.audioLoop,
        detector: state.detector,
        exercise: state.exercise,
        sessionStartTime: Date.now(),
        store: {
          getState: () => ({ practiceState: get().practiceState }),
          setState: (partial: any) => {
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
          },
          stop: get().stop
        },
        analytics: useSessionStore.getState()
      }

      const runner = new PracticeSessionRunnerImpl(runnerDeps)

      const nextState = transitions.start(state, runner)
      set({
        state: nextState,
        practiceState: nextState.practiceState
      })

      // Sync with TunerStore
      useTunerStore.setState({
        state: { kind: 'LISTENING', sessionToken: get().sessionId },
        detector: (state as any).detector?.detector || null // Accessing internal detector from adapter if possible
      })

      runPracticeSession(runnerDeps as any).then(result => {
        const s = get().state
        if (s.status === 'active' && s.runner === runner) {
          const stoppedState = transitions.stop(s)
          set({
            state: stoppedState,
            practiceState: { ...s.practiceState, status: 'idle' } // fallback status
          })
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
      const { state } = get()
      if (state.status === 'active') {
        state.runner.cancel()
        set({ state: transitions.stop(state) })
      }

      await audioManager.cleanup()

      // Analytics
      const sessionStore = useSessionStore.getState()
      if (sessionStore.current) {
        const completed = sessionStore.end()
        if (completed) {
          useProgressStore.getState().addSession(completed)
        }
      }

      set((s) => {
        if (!s.practiceState) return { practiceState: null }
        // Preserve 'completed' status if already reached
        if (s.practiceState.status === 'completed') return { practiceState: s.practiceState }
        return {
          practiceState: { ...s.practiceState, status: 'idle' }
        }
      })
    },

    reset: () => {
      get().stop()
      set({
        state: transitions.reset(),
        practiceState: null,
        error: null,
        liveObservations: []
      })
    },

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      for await (const event of pipeline) {
        const state = get().state
        if (state.status !== 'active' && state.status !== 'ready' && state.status !== 'idle') {
           // Maybe allow it if we have a practiceState
        }

        handlePracticeEvent(
          event,
          {
            getState: () => ({ practiceState: get().practiceState }),
            setState: (partial: any) => {
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
          () => void get().stop()
        )

        // Handle live observations (duplicated from runner for compatibility)
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
              set({ liveObservations: liveObs })
            }
          }
        } else if (event.type === 'NOTE_MATCHED') {
          set({ liveObservations: [] })
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
