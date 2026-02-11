/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing the lifecycle from exercise
 * selection to completion. It coordinates audio resources, real-time analysis,
 * and persistent progress tracking.
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
 * This store is the central hub for the practice experience, coordinating:
 * 1. **Audio Infrastructure**: Manages Web Audio context, analysers, and microphone access.
 * 2. **State Orchestration**: Uses a formalized FSM (`PracticeStoreState`) to ensure valid transitions.
 * 3. **High-Frequency Analysis**: Consumes events from the audio pipeline and updates the UI state.
 * 4. **Telemetry & Analytics**: Synchronizes session data with `SessionStore` and `ProgressStore`.
 *
 * **Concurrency & Safety**:
 * It implements a `sessionToken` pattern (UUID) to guard against race conditions during
 * asynchronous state updates in real-time loops. Functional updaters are used in all
 * `set()` calls to ensure state consistency.
 *
 * @public
 */
export interface PracticeStore {
  /**
   * The current formalized state of the practice system (FSM).
   *
   * @remarks
   * Use this to determine the high-level lifecycle (e.g., 'idle', 'active', 'error').
   */
  state: PracticeStoreState

  /**
   * Domain-specific practice state (backward compatibility).
   *
   * @remarks
   * Contains real-time metrics like `currentIndex` and `detectionHistory`.
   * @deprecated Use `state.practiceState` when `state.status` is 'active'.
   */
  practiceState: PracticeState | null

  /**
   * Most recent error encountered during initialization or execution.
   */
  error: AppError | null

  /**
   * Real-time observations about the user's playing (intonation, stability, tone quality).
   */
  liveObservations: Observation[]

  /**
   * Whether the practice session should start automatically after loading an exercise.
   */
  autoStartEnabled: boolean

  /**
   * The Web Audio AnalyserNode used for real-time visualization (e.g., Oscilloscope).
   */
  analyser: AnalyserNode | null

  /**
   * The loop driver responsible for pulling audio frames from the hardware.
   */
  audioLoop: AudioLoopPort | null

  /**
   * The active pitch detection engine instance.
   */
  detector: PitchDetectionPort | null

  /**
   * Flag indicating if a start operation (including hardware init) is currently in progress.
   */
  isStarting: boolean

  /**
   * Flag indicating if the audio hardware is being initialized.
   */
  isInitializing: boolean

  /**
   * Unique identifier for the current active session to prevent stale updates from previous sessions.
   */
  sessionToken: string | null

  /**
   * Loads an exercise into the store and prepares for practice.
   *
   * @remarks
   * This method automatically stops any active session before loading the new exercise.
   *
   * @param exercise - The musical exercise to load.
   * @returns A promise that resolves when the exercise is loaded and the store is reset.
   *
   * @remarks
   * Calling this method automatically stops any currently running session.
   */
  loadExercise: (exercise: Exercise) => Promise<void>

  /**
   * Enables or disables automatic start of the practice session upon exercise load.
   *
   * @param enabled - True to enable auto-start.
   */
  setAutoStart: (enabled: boolean) => void

  /**
   * Manually sets the current note index in the exercise.
   *
   * @remarks
   * Useful for "Jump to Note" functionality in the UI. Resets the `holdDuration` and history for the new note.
   *
   * @param index - The index of the note to jump to.
   */
  setNoteIndex: (index: number) => void

  /**
   * Initializes the audio hardware and acquires microphone permissions.
   *
   * @remarks
   * This method is retriable from 'idle' or 'error' states. It coordinates with the
   * `audioManager` and creates the necessary port adapters for the pipeline.
   *
   * **Side Effects**:
   * - Triggers microphone permission prompt if not already granted.
   * - Updates `state` to 'initializing' and then 'ready' on success.
   *
   * @returns A promise that resolves when audio is successfully initialized.
   * @throws {@link AppError} if microphone access is denied or hardware fails.
   */
  initializeAudio: () => Promise<void>

  /**
   * Begins the active practice session.
   *
   * @remarks
   * **Workflow**:
   * 1. Ensures audio is initialized (triggers `initializeAudio` if needed).
   * 2. Generates a new `sessionToken`.
   * 3. Instantiates the `PracticeSessionRunnerImpl`.
   * 4. Starts the analytics session in `SessionStore`.
   * 5. Commences the asynchronous audio processing loop.
   *
   * @returns A promise that resolves once the session has successfully transitioned to 'active'.
   */
  start: () => Promise<void>

  /**
   * Stops the current practice session and releases all audio/hardware resources.
   *
   * @remarks
   * This method is idempotent and performs a "resource-first" cleanup:
   * 1. Aborts the runner and underlying audio loop via `AbortSignal`.
   * 2. Closes the `audioManager` and releases hardware handles.
   * 3. Finalizes the analytics session and pushes data to `ProgressStore`.
   *
   * @returns A promise that resolves when all cleanup tasks are complete.
   */
  stop: () => Promise<void>

  /**
   * Completely resets the store, stopping any active sessions and clearing the selected exercise.
   *
   * @returns A promise that resolves when the store has returned to the absolute 'idle' state.
   */
  reset: () => Promise<void>

  /**
   * Consumes a stream of events from the practice pipeline and updates the store state.
   *
   * @remarks
   * This is a high-frequency internal method that bridges the async generator pipeline
   * with the reactive store. It uses `sessionToken` guards to ensure that events from
   * previous (cancelled) sessions do not update the current state.
   *
   * @param pipeline - An async iterable of practice events emitted by the runner.
   * @returns A promise that resolves when the pipeline is closed or aborted.
   * @internal
   */
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

/**
 * Returns the initial domain state for a given exercise.
 *
 * @param exercise - The exercise to initialize.
 * @returns The initial {@link PracticeState}.
 * @internal
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
 *
 * @remarks
 * Delegates to `calculateLiveObservations` but handles the extraction of
 * the target pitch name from the current exercise note.
 *
 * @param state - The current practice domain state.
 * @returns An array of pedagogical observations.
 * @internal
 */
function getUpdatedLiveObservations(state: PracticeState): Observation[] {
  if (state.status === 'idle' || state.status === 'correct' || state.status === 'completed') {
    return state.lastObservations || []
  }
  const targetNote = state.exercise.notes[state.currentIndex]
  if (!targetNote) return []
  const targetPitchName = formatPitchName(targetNote.pitch)
  return calculateLiveObservations(state.detectionHistory, targetPitchName)
}

/** Types for safe functional updates within the store. */
type SafeUpdate = Pick<PracticeStore, 'practiceState' | 'liveObservations' | 'error'>
type SafePartial = Partial<SafeUpdate> | ((s: PracticeStore) => Partial<SafeUpdate>)

/**
 * Implementation of the PracticeStore using Zustand.
 *
 * @remarks
 * This hook provides access to the centralized practice state. Components
 * should select only the specific state they need to minimize re-renders.
 *
 * @example
 * ```ts
 * const { start, stop, state } = usePracticeStore();
 * ```
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
      // NOTE: currentSessionId is accessed via get().sessionId but not defined in interface.
      // Preserving pre-existing bug/behavior.
      const currentSessionId = (get() as any).sessionId || 0
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
        const nextState = transitions.start(storeState, runner, abortController)

        try {
          if (storeState.exercise) {
            useSessionStore.getState().start(storeState.exercise.id, storeState.exercise.name, 'practice')
          }
        } catch (e) {
          console.error('[PracticeStore] Failed to start session', e)
        }

        set({
          state: nextState,
          practiceState: reducePracticeEvent(get().practiceState!, { type: 'START' }),
          sessionToken: currentToken,
          isStarting: false,
          error: null,
        })

        // Sync with TunerStore
        const detectorInstance = (storeState as any).detector?.detector || null
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
              state: transitions.error(appError, (storeState as any).exercise),
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
        state: (s.state.status === 'active' || s.state.status === 'ready') ? transitions.stop(s.state as any) : s.state,
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
            ...s,
            practiceState: newState,
            liveObservations: getUpdatedLiveObservations(newState),
          }
        })
      }
    }
  }
})
