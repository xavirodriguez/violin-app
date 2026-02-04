'use client'

import { create } from 'zustand'
import {
  formatPitchName,
  reducePracticeEvent,
  type PracticeState,
  type PracticeEvent,
} from '@/lib/practice-core'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { calculateLiveObservations } from '@/lib/live-observations'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { WebAudioLoopAdapter, PitchDetectorAdapter } from '@/lib/adapters/web-audio.adapter'
import { WebAudioFrameAdapter } from '@/lib/adapters/web-audio.adapter'
import { PitchDetector } from '@/lib/pitch-detector'
import { useSessionStore } from './session.store'
import { useAnalyticsStore } from './analytics-store'
import { useProgressStore } from './progress.store'
import { useTunerStore } from './tuner-store'
import { PracticeSessionRunnerImpl } from '@/lib/practice/session-runner'
import { transitions, PracticeStoreState } from '@/lib/practice/practice-states'

import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'

/**
 * Main store for managing the practice mode lifecycle and real-time audio pipeline.
 *
 * @remarks
 * This store is the central hub for the practice experience, coordinating the audio
 * infrastructure, the musical domain logic, and the user interface state.
 * It uses a formalized state machine (`PracticeStoreState`) to manage transitions.
 *
 * @public
 */
interface PracticeStore {
  /**
   * The current formalized state of the practice system.
   */
  state: PracticeStoreState

  /**
   * Domain-specific practice state (backward compatibility).
   * @deprecated Use `state.practiceState` when in 'active' status.
   */
  practiceState: PracticeState | null

  /**
   * Most recent error encountered.
   */
  error: AppError | null

  /**
   * Real-time observations about the user's playing (e.g., intonation feedback).
   */
  liveObservations: Observation[]

  /**
   * Whether the practice session should start automatically after loading an exercise.
   */
  autoStartEnabled: boolean

  /**
   * The Web Audio AnalyserNode used for visualization and analysis.
   */
  analyser: AnalyserNode | null

  /**
   * The loop driver responsible for pulling audio frames.
   */
  audioLoop: AudioLoopPort | null

  /**
   * The active pitch detection engine.
   */
  detector: PitchDetectionPort | null

  /**
   * Flag indicating if a start operation is currently in progress.
   */
  isStarting: boolean

  /**
   * Unique identifier for the current active session, used to ignore stale updates.
   */
  sessionId: number

  /**
   * Loads an exercise into the store and resets the practice state.
   *
   * @param exercise - The musical exercise to load.
   * @returns A promise that resolves when the exercise is loaded.
   */
  loadExercise: (exercise: Exercise) => Promise<void>

  /**
   * Enables or disables automatic start of the practice session.
   *
   * @param enabled - True to enable auto-start.
   */
  setAutoStart: (enabled: boolean) => void

  /**
   * Manually jumps to a specific note in the exercise.
   *
   * @param index - The index of the note to jump to.
   */
  setNoteIndex: (index: number) => void

  /**
   * Initializes the audio hardware and acquires necessary permissions.
   *
   * @remarks
   * This is called automatically by `start()` if the system is in 'idle' status.
   *
   * @returns A promise that resolves when audio is ready.
   * @throws {@link AppError} if microphone access is denied or audio context fails.
   */
  initializeAudio: () => Promise<void>

  /**
   * Begins the active practice session, starting the audio loop and analysis.
   *
   * @remarks
   * Implements a guard against concurrent start calls and ensures that only
   * one session is active at a time.
   *
   * @returns A promise that resolves when the session has started.
   */
  start: () => Promise<void>

  /**
   * Stops the current practice session and releases audio resources.
   *
   * @remarks
   * This method is idempotent and handles cleanup even if resources were partially initialized.
   *
   * @returns A promise that resolves when cleanup is complete.
   */
  stop: () => Promise<void>

  /**
   * Completely resets the store to its initial state, stopping any active sessions.
   *
   * @returns A promise that resolves when reset is complete.
   */
  reset: () => Promise<void>

  /**
   * Consumes a stream of events from the practice pipeline and updates the store state.
   *
   * @param pipeline - An async iterable of practice events.
   * @returns A promise that resolves when the pipeline is closed or the session ends.
   * @internal
   */
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

/**
 * Returns the initial domain state for a given exercise.
 */
function getInitialState(exercise: Exercise): PracticeState {
  return {
    status: 'idle',
    exercise,
    currentIndex: 0,
    detectionHistory: [],
    perfectNoteStreak: 0,
  }
}

/**
 * Calculates updated live observations based on the current practice state.
 */
function getUpdatedLiveObservations(state: PracticeState): Observation[] {
  const targetNote = state.exercise.notes[state.currentIndex]
  if (!targetNote) return []
  const targetPitchName = formatPitchName(targetNote.pitch)
  return calculateLiveObservations([...state.detectionHistory], targetPitchName)
}

/**
 * Zustand hook for accessing the PracticeStore.
 *
 * @public
 */
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
        liveObservations: [],
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
        const detector = new PitchDetectorAdapter(new PitchDetector(resources.context.sampleRate))
        const frameAdapter = new WebAudioFrameAdapter(resources.analyser)
        const audioLoop = new WebAudioLoopAdapter(frameAdapter)

        set({
          state: transitions.ready({ audioLoop, detector, exercise }),
          analyser: resources.analyser,
          audioLoop,
          detector,
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

    reset: async () => {
      await get().stop()
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
