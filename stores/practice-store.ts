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
import { formatPitchName, PracticeState, PracticeEvent, reducePracticeEvent } from '@/lib/practice-core'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { calculateLiveObservations } from '@/lib/live-observations'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { PitchDetector } from '@/lib/pitch-detector'
import { WebAudioFrameAdapter, WebAudioLoopAdapter, PitchDetectorAdapter } from '@/lib/adapters/web-audio.adapter'
import { useTunerStore } from './tuner-store'
import { useAnalyticsStore } from './analytics-store'
import { PracticeSessionRunnerImpl } from '@/lib/practice/session-runner'
import { transitions, PracticeStoreState } from '@/lib/practice/practice-states'

import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'

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

function getInitialState(exercise: Exercise): PracticeState {
  return {
    status: 'idle',
    exercise,
    currentIndex: 0,
    detectionHistory: [],
    holdDuration: 0,
    perfectNoteStreak: 0,
    lastObservations: [],
  }
}

function getUpdatedLiveObservations(state: PracticeState): Observation[] {
  const targetNote = state.exercise.notes[state.currentIndex]
  if (!targetNote) return []
  const targetPitchName = formatPitchName(targetNote.pitch)
  return calculateLiveObservations([...state.detectionHistory], targetPitchName)
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
        state: { status: 'idle', exercise, error: null },
        practiceState: getInitialState(exercise),
        error: null,
        liveObservations: []
      }))
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
      if (currentState.status !== 'idle' || !currentState.exercise) {
        return
      }

      set((s) => ({ ...s, state: transitions.initialize(currentState.exercise) }))

      try {
        const deviceId = useTunerStore.getState().deviceId || undefined
        const resources = await audioManager.initialize(deviceId)
        const detector = new PitchDetectorAdapter(new PitchDetector(resources.context.sampleRate))
        const frameAdapter = new WebAudioFrameAdapter(resources.analyser)
        const audioLoop = new WebAudioLoopAdapter(frameAdapter)

        const nextState = transitions.ready({
          audioLoop,
          detector,
          exercise: currentState.exercise
        })

        set((s) => ({
          ...s,
          state: nextState,
          analyser: resources.analyser,
          detector,
          audioLoop
        }))
      } catch (err) {
        const appError = toAppError(err)
        set((s) => ({
          ...s,
          state: transitions.error(appError),
          error: appError
        }))
      }
    },

    start: async () => {
      if (get().isStarting) return
      set((state) => ({ ...state, isStarting: true }))

      try {
        const currentStateAtStart = get().state
        if (currentStateAtStart.status === 'idle' && currentStateAtStart.exercise) {
          await get().initializeAudio()
        }

        const state = get().state
        if (state.status !== 'ready') {
          set((s) => ({ ...s, isStarting: false }))
          return
        }

        const newSessionId = get().sessionId + 1
        const sessionStartTime = Date.now()

        const safeSet = (partial: any) => {
          if (get().sessionId !== newSessionId) return
          set((s) => {
            const next = typeof partial === 'function' ? partial(s) : partial
            const ps = next.practiceState || s.practiceState
            if (!ps) return s

            const liveObservations = getUpdatedLiveObservations(ps)

            if (s.state.status === 'active') {
              return {
                ...s,
                ...next,
                state: { ...s.state, practiceState: ps },
                practiceState: ps,
                liveObservations
              }
            }
            return {
              ...s,
              ...next,
              practiceState: ps,
              liveObservations
            }
          })
        }

        const runnerDeps = {
          audioLoop: state.audioLoop,
          detector: state.detector,
          exercise: state.exercise,
          sessionStartTime,
          store: {
            getState: () => ({ practiceState: get().practiceState }),
            setState: safeSet,
            stop: get().stop
          },
          analytics: {
            recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) =>
              useAnalyticsStore.getState().recordNoteAttempt(index, pitch, cents, inTune),
            recordNoteCompletion: (index: number, timeMs: number, technique?: any) =>
              useAnalyticsStore.getState().recordNoteCompletion(index, timeMs, technique),
            endSession: () => useAnalyticsStore.getState().endSession()
          },
          updatePitch: (pitch: number, confidence: number) => {
            useTunerStore.getState().updatePitch(pitch, confidence)
          }
        }

        const runner = new PracticeSessionRunnerImpl(runnerDeps)
        const nextState = transitions.start(state, runner)

        useAnalyticsStore.getState().startSession(
          state.exercise.id,
          state.exercise.name,
          'practice'
        )

        set((s) => ({
          ...s,
          state: nextState,
          practiceState: reducePracticeEvent(s.practiceState!, { type: 'START' }),
          sessionId: newSessionId,
          isStarting: false,
          error: null
        }))

        // Sync with TunerStore
        useTunerStore.setState({
          state: { kind: 'LISTENING', sessionToken: newSessionId },
          detector: (state.detector as any).detector || null
        })

        // Run the session
        runner.run(new AbortController().signal).catch((err) => {
          const isAbort = err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
          if (!isAbort) {
            console.error('[PracticeStore] Session runner failed:', err)
            set((s) => ({ ...s, error: toAppError(err) }))
            get().stop()
          }
        })

      } catch (error) {
        set((s) => ({
          ...s,
          error: toAppError(error),
          isStarting: false,
        }))
      }
    },

    stop: async () => {
      const { state, sessionId } = get()
      const nextSessionId = sessionId + 1

      if (state.status === 'active') {
        state.runner.cancel()
      }

      try {
        await audioManager.cleanup()
      } catch (err) {
        console.warn('[PracticeStore] Error during audio cleanup:', err)
      }

      useAnalyticsStore.getState().endSession()

      set((s) => ({
        ...s,
        state: s.state.status === 'active' || s.state.status === 'ready'
          ? { status: 'idle', exercise: s.state.exercise, error: null }
          : s.state,
        practiceState: s.practiceState
          ? reducePracticeEvent(s.practiceState, { type: 'STOP' })
          : null,
        analyser: null,
        detector: null,
        audioLoop: null,
        liveObservations: [],
        sessionId: nextSessionId,
        isStarting: false,
      }))
    },

    reset: async () => {
      await get().stop()
      set((s) => ({
        ...s,
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
        const liveObservations = event.type === 'NOTE_MATCHED'
          ? []
          : getUpdatedLiveObservations(newState)

        set((s) => {
          if (s.sessionId !== currentSessionId) return s
          return {
            ...s,
            practiceState: newState,
            liveObservations
          }
        })
      }
    }
  }
})
