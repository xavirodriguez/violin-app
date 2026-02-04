'use client'

import { create } from 'zustand'
import { formatPitchName, reducePracticeEvent } from '@/lib/practice-core'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { calculateLiveObservations } from '@/lib/live-observations'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { PitchDetector } from '@/lib/pitch-detector'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { WebAudioLoopAdapter, PitchDetectorAdapter } from '@/lib/adapters/web-audio.adapter'
import { useSessionStore } from './session.store'
import { useProgressStore } from './progress.store'
import { useTunerStore } from './tuner-store'
import { PracticeSessionRunnerImpl } from '@/lib/practice/session-runner'
import { transitions, PracticeStoreState } from '@/lib/practice/practice-states'

import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'
import { PracticeState, PracticeEvent } from '@/lib/practice-core'

interface PracticeStore {
  state: PracticeStoreState
  practiceState: PracticeState | null
  error: AppError | null
  liveObservations: Observation[]
  autoStartEnabled: boolean
  analyser: AnalyserNode | null
  audioLoop: AudioLoopPort | null
  detector: PitchDetectionPort | null
  isStarting: boolean
  sessionId: number

  loadExercise: (exercise: Exercise) => Promise<void>
  setAutoStart: (enabled: boolean) => void
  setNoteIndex: (index: number) => void
  initializeAudio: () => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => Promise<void>
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

function getInitialState(exercise: Exercise): PracticeState {
  return {
    status: 'idle',
    exercise,
    currentIndex: 0,
    detectionHistory: [],
    perfectNoteStreak: 0,
  }
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
      set({
        practiceState: getInitialState(exercise),
        state: { status: 'idle', exercise, error: null },
        error: null,
        liveObservations: []
      })
    },

    setAutoStart: (enabled) => set({ autoStartEnabled: enabled }),

    setNoteIndex: (index) => {
      const { practiceState } = get()
      if (practiceState) {
        const newPracticeState: PracticeState = {
          ...practiceState,
          currentIndex: Math.max(0, Math.min(index, practiceState.exercise.notes.length - 1)),
          status: 'listening',
          holdDuration: 0,
          detectionHistory: [],
        }
        set({ practiceState: newPracticeState })
      }
    },

    initializeAudio: async () => {
      const { state: storeState } = get()
      const exercise = storeState.status !== 'error' ? storeState.exercise : null
      const deviceId = useTunerStore.getState().deviceId

      if (!exercise) {
         set({ error: toAppError('No exercise loaded') })
         return
      }

      set({ state: transitions.initialize(exercise) })

      try {
        const resources = await audioManager.initialize(deviceId ?? undefined)
        const audioLoop = new WebAudioLoopAdapter(resources.analyser)
        const detector = new PitchDetectorAdapter(new PitchDetector(resources.context.sampleRate))

        set({
          state: transitions.ready({ audioLoop, detector, exercise }),
          analyser: resources.analyser,
          audioLoop,
          detector
        })
      } catch (err) {
        const appError = toAppError(err)
        set({ state: transitions.error(appError), error: appError })
      }
    },

    start: async () => {
      const currentSessionId = get().sessionId
      const newSessionId = currentSessionId + 1

      set({ isStarting: true, error: null })

      try {
        let storeState = get().state
        if (storeState.status === 'idle' && storeState.exercise) {
          await get().initializeAudio()
          storeState = get().state
        }

        if (storeState.status !== 'ready') {
           set({ isStarting: false })
           return
        }

        const safeSet = (partial: any) => {
          if (get().sessionId !== newSessionId) return
          set(partial)
        }

        const runnerDeps = {
          audioLoop: storeState.audioLoop,
          detector: storeState.detector,
          exercise: storeState.exercise,
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
        const nextState = transitions.start(storeState, runner)

        useSessionStore.getState().start(storeState.exercise.id, storeState.exercise.name)

        // Sync with TunerStore
        useTunerStore.setState({
          state: { kind: 'LISTENING', sessionToken: newSessionId },
          detector: (storeState as any).detector?.detector || null
        })

        set({
          state: nextState,
          practiceState: nextState.practiceState,
          sessionId: newSessionId,
          isStarting: false,
          error: null
        })

        // Actually run the session loop
        const abortController = new AbortController()
        runner.run(abortController.signal).catch((err) => {
          const isAbort = err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
          if (!isAbort) {
            console.error('[PracticeStore] Session runner failed:', err)
            set({ error: toAppError(err) })
            get().stop()
          }
        })

      } catch (err) {
        set({ error: toAppError(err), isStarting: false })
      }
    },

    stop: async () => {
      const { state } = get()
      if (state.status === 'active') {
        state.runner.cancel()
      }

      await audioManager.cleanup()

      const nextSessionId = get().sessionId + 1

      set((s) => ({
        ...s,
        state: s.state.status === 'active' ? transitions.stop(s.state) : s.state,
        practiceState: s.practiceState ? { ...s.practiceState, status: 'idle' } : null,
        analyser: null,
        audioLoop: null,
        detector: null,
        liveObservations: [],
        sessionId: nextSessionId,
        isStarting: false,
      }))
    },

    reset: () => {
      get().stop()
      set({
        state: transitions.reset(),
        practiceState: null,
        error: null,
        liveObservations: [],
      })
    },

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      const currentSessionId = get().sessionId

      for await (const event of pipeline) {
        if (get().sessionId !== currentSessionId) break
        if (!event || !event.type) continue

        const currentState = get().practiceState
        if (!currentState) break

        const newState = reducePracticeEvent(currentState, event)

        set((state) => {
          if (state.sessionId !== currentSessionId) return state

          let liveObs = state.liveObservations
          if (event.type === 'NOTE_DETECTED') {
            const targetNote = newState.exercise.notes[newState.currentIndex]
            if (targetNote) {
              const targetPitchName = formatPitchName(targetNote.pitch)
              liveObs = calculateLiveObservations(
                [...newState.detectionHistory],
                targetPitchName
              )
            }
          } else if (event.type === 'NOTE_MATCHED') {
            liveObs = []
          }

          return {
            ...state,
            practiceState: newState,
            liveObservations: liveObs,
          }
        })
      }
    }
  }
})
