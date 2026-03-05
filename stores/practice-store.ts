/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing:
 * 1. FSM (State Machine) for the practice flow.
 * 2. Audio resources (Web Audio, Pitch Detection).
 * 3. Asynchronous runner loop.
 * 4. Analytics and progress tracking.
 */

'use client'

import { create } from 'zustand'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { WebAudioFrameAdapter, WebAudioLoopAdapter, PitchDetectorAdapter } from '@/lib/adapters/web-audio.adapter'
import { useSessionStore } from './session.store'
import { useProgressStore } from './progress.store'
import { useTunerStore } from './tuner-store'
import { PracticeSessionRunnerImpl } from '@/lib/practice/session-runner'
import { handlePracticeEvent } from '@/lib/practice/practice-event-sink'
import { transitions, PracticeStoreState, getInitialState, getUpdatedLiveObservations } from '@/lib/practice/practice-states'

import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'
import { PracticeState, PracticeEvent } from '@/lib/practice-core'

interface PracticeStore {
  // Explicit State
  state: PracticeStoreState

  // Backward compatibility properties
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
      const initialPracticeState = getInitialState(exercise)
      set({
        state: { status: 'idle', exercise, error: null },
        practiceState: initialPracticeState,
        error: null,
        liveObservations: []
      })
    },

    setAutoStart: (enabled) => set({ autoStartEnabled: enabled }),

    setNoteIndex: (index) => {
      set((state) => {
        if (!state.practiceState) return state
        const nextPracticeState: PracticeState = {
          ...state.practiceState,
          currentIndex: Math.max(0, Math.min(index, state.practiceState.exercise.notes.length - 1)),
          status: 'listening',
          holdDuration: 0,
          detectionHistory: [],
        }
        return {
          practiceState: nextPracticeState,
          state: state.state.status === 'active'
            ? { ...state.state, practiceState: nextPracticeState }
            : state.state
        }
      })
    },

    initializeAudio: async () => {
      const { state } = get()
      if (state.status !== 'idle' || !state.exercise) return

      try {
        const tunerState = useTunerStore.getState()
        const deviceId = tunerState.deviceId || undefined

        const resources = await audioManager.initialize(deviceId)
        const frameProvider = new WebAudioFrameAdapter(resources.analyser)
        const audioLoop = new WebAudioLoopAdapter(frameProvider)
        const detector = new PitchDetectorAdapter(tunerState.detector!)

        set({
          analyser: resources.analyser,
          audioLoop,
          detector,
          state: { status: 'ready', exercise: state.exercise, audioLoop, detector }
        })

        // Sync TunerStore state
        useTunerStore.setState({
          state: { kind: 'READY', sessionToken: get().sessionId },
          detector: tunerState.detector
        })

      } catch (error) {
        const appError = toAppError(error)
        set({
          error: appError,
          state: { status: 'error', error: appError }
        })
      }
    },

    start: async () => {
      if (get().isStarting) return
      set({ isStarting: true })

      try {
        let currentState = get().state
        if (currentState.status === 'idle' && currentState.exercise) {
          await get().initializeAudio()
          currentState = get().state
        }

        if (currentState.status !== 'ready') {
          set({ isStarting: false })
          return
        }

        const newSessionId = get().sessionId + 1

        const runnerDeps = {
          audioLoop: currentState.audioLoop,
          detector: currentState.detector,
          exercise: currentState.exercise,
          sessionStartTime: Date.now(),
          store: {
            getState: () => ({ practiceState: get().practiceState }),
            setState: (partial: any) => {
              if (get().sessionId !== newSessionId) return
              set((s) => {
                const next = typeof partial === 'function' ? partial({ practiceState: s.practiceState }) : partial
                const nextPracticeState = next.practiceState || s.practiceState
                const liveObs = getUpdatedLiveObservations(nextPracticeState)

                return {
                  practiceState: nextPracticeState,
                  liveObservations: liveObs,
                  state: s.state.status === 'active' ? { ...s.state, practiceState: nextPracticeState } : s.state
                }
              })
            },
            stop: async () => { await get().stop() }
          },
          analytics: {
            endSession: () => {
              const completed = useSessionStore.getState().end()
              if (completed) {
                useProgressStore.getState().addSession(completed)
              }
            },
            recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) =>
              useSessionStore.getState().recordAttempt(index, pitch, cents, inTune),
            recordNoteCompletion: (index: number, timeMs: number, technique?: any) =>
              useSessionStore.getState().recordCompletion(index, timeMs, technique)
          }
        }

        const runner = new PracticeSessionRunnerImpl(runnerDeps)
        const nextState = transitions.start(currentState, runner)

        useSessionStore.getState().start(currentState.exercise.id, currentState.exercise.name)

        // Sync TunerStore to LISTENING
        useTunerStore.setState({
          state: {
            kind: 'LISTENING',
            sessionToken: newSessionId,
            pitch: 0,
            note: '',
            cents: 0,
            confidence: 0
          }
        })

        set({
          state: nextState,
          practiceState: nextState.practiceState,
          sessionId: newSessionId,
          isStarting: false,
          error: null
        })

        runner.run(new AbortController().signal).catch((err: any) => {
          const isAbort = err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
          if (!isAbort) {
            console.error('[PracticeStore] Runner failed:', err)
            const appError = toAppError(err)
            set({
              error: appError,
              state: { status: 'error', error: appError }
            })
            get().stop()
          }
        })

      } catch (error) {
        const appError = toAppError(error)
        set({
          error: appError,
          state: { status: 'error', error: appError },
          isStarting: false
        })
      }
    },

    stop: async () => {
      const { state, sessionId } = get()

      if (state.status === 'active') {
        state.runner.cancel()
      }

      await audioManager.cleanup()

      const sessionStore = useSessionStore.getState()
      if (sessionStore.isActive) {
        const completed = sessionStore.end()
        if (completed) {
          useProgressStore.getState().addSession(completed)
        }
      }

      // Sync TunerStore back to IDLE
      useTunerStore.setState({
        state: { kind: 'IDLE' }
      })

      set({
        state: { status: 'idle', exercise: 'exercise' in state ? state.exercise : null, error: null },
        practiceState: get().practiceState ? { ...get().practiceState!, status: 'idle' } : null,
        analyser: null,
        audioLoop: null,
        detector: null,
        liveObservations: [],
        sessionId: sessionId + 1,
        isStarting: false
      })
    },

    reset: async () => {
      await get().stop()
      set({
        practiceState: null,
        error: null,
        liveObservations: []
      })
    },

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      const currentSessionId = get().sessionId

      for await (const event of pipeline) {
        if (get().sessionId !== currentSessionId) break
        if (!event || !event.type) continue

        // Use the common handler
        handlePracticeEvent(event, {
          getState: () => ({ practiceState: get().practiceState }),
          setState: (partial: any) => {
            if (get().sessionId !== currentSessionId) return
            set((s) => {
              const next = typeof partial === 'function' ? partial({ practiceState: s.practiceState }) : partial
              const nextPracticeState = next.practiceState || s.practiceState
              const liveObs = getUpdatedLiveObservations(nextPracticeState)
              return {
                practiceState: nextPracticeState,
                liveObservations: liveObs,
                state: s.state.status === 'active' ? { ...s.state, practiceState: nextPracticeState } : s.state
              }
            })
          }
        }, () => void get().stop())
      }
    }
  }
})
