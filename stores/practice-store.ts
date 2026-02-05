/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing:
 * 1. FSM (State Machine) for the practice flow.
 * 2. Audio resources (Web Audio, Pitch Detection).
 * 3. Asynchronous runner loop.
 * 4. Analytics and progress tracking (via Session and Progress stores).
 *
 * Refactored to handle:
 * - Concurrency: Guards against double start and stale updates using sessionToken.
 * - Resource Lifecycle: Resource-first cleanup in stop() to prevent leaks.
 * - Reactivity: analyser and detector are stored in state for UI consistency.
 */

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
import { PitchDetector } from '@/lib/pitch-detector'
import { WebAudioFrameAdapter, WebAudioLoopAdapter, PitchDetectorAdapter } from '@/lib/adapters/web-audio.adapter'
import { useSessionStore } from './session.store'
import { useAnalyticsStore } from './analytics-store'
import { useProgressStore } from './progress.store'
import { useTunerStore } from './tuner-store'
import { PracticeSessionRunnerImpl } from '@/lib/practice/session-runner'
import { transitions, PracticeStoreState } from '@/lib/practice/practice-states'

import type { Exercise } from '@/lib/exercises/types'
import { Observation, NoteTechnique } from '@/lib/technique-types'

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
  isInitializing: boolean
  sessionToken: string | null

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

function getUpdatedLiveObservations(state: PracticeState): Observation[] {
  const targetNote = state.exercise.notes[state.currentIndex]
  if (!targetNote) return []
  const targetPitchName = formatPitchName(targetNote.pitch)
  return calculateLiveObservations(state.detectionHistory, targetPitchName)
}

type SafeUpdate = Pick<PracticeStore, 'practiceState' | 'liveObservations' | 'error'>
type SafePartial = Partial<SafeUpdate> | ((s: PracticeStore) => Partial<SafeUpdate>)

export const usePracticeStore = create<PracticeStore>((set, get) => {
  return {
    state: { status: 'idle', exercise: null, error: null },
    practiceState: null,
    error: null,
    liveObservations: [],
    autoStartEnabled: false,
    isStarting: false,
    isInitializing: false,
    sessionToken: null,
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
        sessionToken: null,
      }))
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
      if (get().isInitializing) return
      const { state: currentState } = get()
      const isRetriable = currentState.status === 'idle' || currentState.status === 'error'
      if (!isRetriable || !currentState.exercise) {
        return
      }

      set((s) => ({
        ...s,
        isInitializing: true,
        error: null,
        state: transitions.initialize(currentState.exercise),
      }))

      try {
        const deviceId = useTunerStore.getState().deviceId || undefined
        const resources = await audioManager.initialize(deviceId)
        const detector = new PitchDetectorAdapter(new PitchDetector(resources.context.sampleRate))
        const frameAdapter = new WebAudioFrameAdapter(resources.analyser)
        const audioLoop = new WebAudioLoopAdapter(frameAdapter)

        const nextState = transitions.ready({
          audioLoop,
          detector,
          exercise: currentState.exercise,
        })

        set((s) => ({
          ...s,
          state: nextState,
          analyser: resources.analyser,
          detector,
          audioLoop,
          isInitializing: false,
        }))
      } catch (err) {
        const appError = toAppError(err)
        set((s) => ({
          ...s,
          state: transitions.error(appError, currentState.exercise),
          error: appError,
          isInitializing: false,
        }))
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

        const currentToken = crypto.randomUUID()
        const sessionStartTime = Date.now()
        const abortController = new AbortController()

        const safeSet = (partial: SafePartial) => {
          if (get().sessionToken !== currentToken) return
          set((s) => {
            const next = typeof partial === 'function' ? partial(s) : partial
            const ps = next.practiceState || s.practiceState

            const liveObservations = ps ? getUpdatedLiveObservations(ps) : s.liveObservations

            if (s.state.status === 'active') {
              return {
                ...s,
                ...next,
                state: { ...s.state, practiceState: ps || s.state.practiceState },
                practiceState: ps,
                liveObservations: next.liveObservations ?? liveObservations,
              }
            }
            return {
              ...s,
              ...next,
              practiceState: ps,
              liveObservations: next.liveObservations ?? liveObservations,
            }
          })
        }

        const runnerDeps = {
          audioLoop: storeState.audioLoop,
          detector: storeState.detector,
          exercise: storeState.exercise,
          sessionStartTime: Date.now(),
          store: {
            getState: () => ({
              practiceState: get().practiceState,
              liveObservations: get().liveObservations,
            }),
            setState: safeSet,
            stop: get().stop,
          },
          analytics: {
            recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => {
              try {
                useSessionStore.getState().recordAttempt(index, pitch, cents, inTune)
              } catch (e) {
                console.error('[PracticeStore] session.recordAttempt failed', e)
              }
            },
            recordNoteCompletion: (index: number, timeMs: number, technique?: NoteTechnique) => {
              try {
                useSessionStore.getState().recordCompletion(index, timeMs, technique)
              } catch (e) {
                console.error('[PracticeStore] session.recordCompletion failed', e)
              }
            },
            endSession: () => {
              try {
                const session = useSessionStore.getState().end()
                if (session) {
                  useProgressStore.getState().addSession(session)
                }
              } catch (e) {
                console.error('[PracticeStore] finalize session failed', e)
              }
            },
          },
          updatePitch: (pitch: number, confidence: number) => {
            useTunerStore.getState().updatePitch(pitch, confidence)
          },
        }

        const runner = new PracticeSessionRunnerImpl(runnerDeps)
        const nextState = transitions.start(state, runner, abortController)

        try {
          useSessionStore.getState().start(state.exercise.id, state.exercise.name, 'practice')
        } catch (e) {
          console.error('[PracticeStore] Failed to start session', e)
        }

        // Sync with TunerStore
        useTunerStore.setState({
          state: { kind: 'LISTENING', sessionToken: newSessionId },
          detector: (storeState as any).detector?.detector || null
        })

        set({
          state: nextState,
          practiceState: reducePracticeEvent(s.practiceState!, { type: 'START' }),
          sessionToken: currentToken,
          isStarting: false,
          error: null,
        }))

        // Sync with TunerStore
        const detectorInstance = (state.detector as PitchDetectorAdapter).detector || null
        useTunerStore.setState({
          state: { kind: 'LISTENING', sessionToken: currentToken },
          detector: detectorInstance,
        })

        // Run the session
        runner.run(abortController.signal).catch((err) => {
          const isAbort = err && typeof err === 'object' && 'name' in err && err.name === 'AbortError'
          if (!isAbort) {
            console.error('[PracticeStore] Session runner failed:', err)
            const appError = toAppError(err)
            set((s) => ({
              ...s,
              state: transitions.error(appError, state.exercise),
              error: appError,
            }))
            void get().stop()
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
      const { state } = get()

      if (state.status === 'active') {
        try {
          state.abortController.abort()
          state.runner.cancel()
        } catch (err) {
          console.warn('[PracticeStore] Error cancelling runner:', err)
        }
      }

      await audioManager.cleanup()

      try {
        const session = useSessionStore.getState().end()
        if (session) {
          useProgressStore.getState().addSession(session)
        }
      } catch (err) {
        console.warn('[PracticeStore] Error ending session:', err)
      }

      set((s) => ({
        ...s,
        state: s.state.status === 'active' ? transitions.stop(s.state) : s.state,
        practiceState: s.practiceState ? { ...s.practiceState, status: 'idle' } : null,
        analyser: null,
        audioLoop: null,
        detector: null,
        liveObservations: [],
        sessionToken: null,
        isStarting: false,
        isInitializing: false,
      }))
    },

    reset: async () => {
      await get().stop()
      set((s) => ({
        ...s,
        state: { status: 'idle', exercise: null, error: null },
        practiceState: null,
        error: null,
        liveObservations: [],
        sessionToken: null,
      }))
    },

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      const currentToken = get().sessionToken

      for await (const event of pipeline) {
        if (get().sessionToken !== currentToken) break

        if (!event || !event.type) {
          console.warn('[PIPELINE] Invalid event in consumePipelineEvents:', event)
          continue
        }

        const currentState = get().practiceState
        if (!currentState) break

        const newState = reducePracticeEvent(currentState, event)

        set((s) => {
          if (s.sessionToken !== currentToken) return s
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
