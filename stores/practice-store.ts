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
import { transitions, PracticeStoreState, ReadyState, ActiveState } from '@/lib/practice/practice-states'

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
   * **Resource Management**:
   * Calling `stop()` or `reset()` ensures that all Web Audio resources are released
   * and any active asynchronous runners are cancelled via `AbortSignal`.
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
   * Numeric session identifier for coordination with TunerStore.
   * @internal
   */
  sessionId: number

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
   * 2. Generates a new `sessionToken` (UUID) to guard subsequent state updates.
   * 3. Instantiates the {@link PracticeSessionRunnerImpl} with current dependencies.
   * 4. Starts the analytics session in `SessionStore`.
   * 5. Synchronizes state with `TunerStore` to set the detector instance.
   * 6. Commences the asynchronous audio processing loop.
   *
   * **Reentrancy**: If a session is already starting, subsequent calls return early
   * to avoid duplicate resource allocation.
   *
   * @returns A promise that resolves once the session has successfully transitioned to 'active'.
   */
  start: () => Promise<void>

  /**
   * Stops the current practice session and releases all audio/hardware resources.
   *
   * @remarks
   * This method is idempotent and performs a coordinated "resource-first" cleanup:
   * 1. **Abort Signal**: Triggers the `AbortController` which stops the runner and audio loop.
   * 2. **Hardware Release**: Closes the `audioManager` and releases microphone handles.
   * 3. **Analytics**: Finalizes the current analytics session and pushes results to `ProgressStore`.
   * 4. **State Reset**: Clears high-frequency metrics (`liveObservations`) and transitions to `idle`.
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
   * with the reactive store.
   *
   * **Atomic Updates**: It uses `reducePracticeEvent` to calculate the next state
   * and applies it using functional updaters to ensure UI consistency even during
   * rapid event emission (e.g., vibrato analysis).
   *
   * **Safety**: It uses `sessionToken` guards to ensure that events from
   * previous (cancelled) sessions do not update the current state, preventing
   * "ghost" updates after the user has stopped a session.
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

/**
 * Types for safe functional updates within the store during active sessions.
 *
 * @remarks
 * These types define the subset of state that the {@link PracticeSessionRunnerImpl}
 * is allowed to modify. This restriction prevents the runner from accidentally
 * altering infrastructure-level state like `analyser` or `audioLoop`.
 *
 * @internal
 */
type SafeUpdate = Pick<PracticeStore, 'practiceState' | 'liveObservations' | 'error'>

/**
 * Functional updater or partial state for safe store updates.
 *
 * @internal
 */
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
/**
 * Creates a safe state update function for the practice session.
 *
 * @param set - Zustand set function.
 * @param get - Zustand get function.
 * @param currentToken - Unique token for the current session.
 * @returns A function that applies partial updates to the store if the token matches.
 */
function createSafeSet(
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void,
  get: () => PracticeStore,
  currentToken: string
) {
  return (partial: SafePartial) => {
    if (get().sessionToken !== currentToken) return
    set((s) => {
      const next = typeof partial === 'function' ? partial(s) : partial
      const ps = next.practiceState || s.practiceState
      const liveObservations = ps ? getUpdatedLiveObservations(ps) : s.liveObservations

      const updates: Partial<PracticeStore> = {
        ...next,
        practiceState: ps,
        liveObservations: next.liveObservations ?? liveObservations,
      }

      if (s.state.status === 'active') {
        updates.state = { ...s.state, practiceState: ps || s.state.practiceState }
      }

      return updates
    })
  }
}

/**
 * Creates the dependencies required for the PracticeSessionRunner.
 */
function createRunnerDeps(
  get: () => PracticeStore,
  safeSet: ReturnType<typeof createSafeSet>,
  storeState: ReadyState
) {
  return {
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
      endSession: finalizeAnalyticsSession,
    },
    updatePitch: (pitch: number, confidence: number) => {
      useTunerStore.getState().updatePitch(pitch, confidence)
    },
  }
}

/**
 * Synchronizes the practice session state with the TunerStore.
 */
function syncWithTuner(token: string | number, detector: PitchDetectionPort | null) {
  const detectorInstance = (detector as PitchDetectorAdapter)?.detector || null
  useTunerStore.setState({
    state: { kind: 'LISTENING', sessionToken: token },
    detector: detectorInstance,
  })
}

/**
 * Finalizes the current analytics session and records it in progress history.
 */
function finalizeAnalyticsSession() {
  try {
    const session = useSessionStore.getState().end()
    if (session) {
      useProgressStore.getState().addSession(session)
    }
  } catch (err) {
    console.warn('[PracticeStore] Error ending session:', err)
  }
}

/**
 * Cancels the active session runner and its associated pipeline.
 */
function cancelActiveRunner(state: PracticeStoreState) {
  if (state.status === 'active') {
    try {
      state.abortController.abort()
      state.runner.cancel()
    } catch (err) {
      console.warn('[PracticeStore] Error cancelling runner:', err)
    }
  }
}

/**
 * Returns the state updates required to return the store to an idle/ready state.
 */
function getStopStateUpdates(s: PracticeStore): Partial<PracticeStore> {
  const isCancellable = s.state.status === 'active' || s.state.status === 'ready'
  return {
    state: isCancellable ? transitions.stop(s.state as ActiveState | ReadyState) : s.state,
    practiceState: s.practiceState ? { ...s.practiceState, status: 'idle' } : null,
    analyser: null,
    audioLoop: null,
    detector: null,
    liveObservations: [],
    sessionToken: null,
    isStarting: false,
    isInitializing: false,
  }
}

/**
 * Creates the audio adapters required for the practice pipeline.
 */
function createAudioAdapters(resources: { context: { sampleRate: number }; analyser: AnalyserNode }) {
  const detector = new PitchDetectorAdapter(new PitchDetector(resources.context.sampleRate))
  const frameAdapter = new WebAudioFrameAdapter(resources.analyser)
  const audioLoop = new WebAudioLoopAdapter(frameAdapter)
  return { detector, audioLoop }
}

/**
 * Updates the store state based on a practice event if the session token is valid.
 */
function updateStateFromEvent(
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void,
  event: PracticeEvent,
  token: string | null
) {
  set((s) => {
    if (s.sessionToken !== token || !s.practiceState) return s
    const newState = reducePracticeEvent(s.practiceState, event)
    return {
      ...s,
      practiceState: newState,
      liveObservations: getUpdatedLiveObservations(newState),
    }
  })
}

/**
 * Determines if the audio hardware can be initialized based on current state.
 */
function shouldInitialize(state: PracticeStoreState, isInitializing: boolean): boolean {
  if (isInitializing || !state.exercise) return false
  return state.status === 'idle' || state.status === 'error'
}

/**
 * Returns the state updates for a successful audio initialization.
 */
function getSuccessInitUpdates(
  s: PracticeStore,
  resources: { analyser: AnalyserNode },
  adapters: { detector: PitchDetectionPort; audioLoop: AudioLoopPort }
): Partial<PracticeStore> {
  return {
    ...s,
    ...adapters,
    state: transitions.ready({ ...adapters, exercise: s.state.exercise! }),
    analyser: resources.analyser,
    isInitializing: false,
  }
}

/**
 * Returns the state updates for a failed audio initialization.
 */
function getFailureInitUpdates(s: PracticeStore, err: unknown): Partial<PracticeStore> {
  const error = toAppError(err)
  return {
    ...s,
    error,
    isInitializing: false,
    state: transitions.error(error, s.state.exercise),
  }
}

/**
 * Starts the analytics session for the given exercise.
 */
function startAnalyticsSession(exercise: Exercise | null) {
  if (!exercise) return
  try {
    useSessionStore.getState().start(exercise.id, exercise.name, 'practice')
  } catch (e) {
    console.error('[PracticeStore] Failed to start session', e)
  }
}

/**
 * Handles terminal failures in the session runner.
 */
function handleRunnerFailure(
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void,
  get: () => PracticeStore,
  err: unknown,
  exercise: Exercise | null
) {
  const isAbort = err && typeof err === 'object' && 'name' in err && (err as Error).name === 'AbortError'
  if (!isAbort) {
    console.error('[PracticeStore] Session runner failed:', err)
    const error = toAppError(err)
    set((s) => ({ ...s, error, state: transitions.error(error, exercise) }))
    void get().stop()
  }
}

/**
 * Returns the state updates for starting a practice session.
 */
function getStartStateUpdates(
  s: PracticeStore,
  storeState: ReadyState,
  runner: PracticeSessionRunner,
  abortController: AbortController,
  token: string
): Partial<PracticeStore> {
  return {
    ...s,
    state: transitions.start(storeState, runner, abortController),
    practiceState: s.practiceState ? reducePracticeEvent(s.practiceState, { type: 'START' }) : null,
    sessionToken: token,
    isStarting: false,
    error: null,
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
    isInitializing: false,
    sessionToken: null,
    sessionId: 0,
    analyser: null,
    audioLoop: null,
    detector: null,

    loadExercise: async (exercise) => {
      await get().stop()
      set((s) => ({
        ...s,
        practiceState: getInitialState(exercise),
        state: { status: 'idle', exercise, error: null },
        error: null,
        liveObservations: [],
        sessionToken: null,
      }))
    },

    setAutoStart: (enabled) => set((s) => ({ ...s, autoStartEnabled: enabled })),

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
        set((s) => ({ ...s, practiceState: newPracticeState }))
      }
    },

    initializeAudio: async () => {
      if (!shouldInitialize(get().state, get().isInitializing)) return
      set((s) => ({ ...s, isInitializing: true, error: null, state: transitions.initialize(s.state.exercise) }))
      try {
        const resources = await audioManager.initialize(useTunerStore.getState().deviceId || undefined)
        const adapters = createAudioAdapters(resources)
        set((s) => getSuccessInitUpdates(s, resources, adapters))
      } catch (err) {
        set((s) => getFailureInitUpdates(s, err))
      }
    },

    start: async () => {
      set({ isStarting: true, error: null })
      try {
        let storeState = get().state
        if (storeState.status === 'idle' && storeState.exercise) {
          await get().initializeAudio()
          storeState = get().state
        }
        if (storeState.status !== 'ready') return set({ isStarting: false })

        const token = crypto.randomUUID()
        const nextSessionId = get().sessionId + 1
        const abortController = new AbortController()
        const runner = new PracticeSessionRunnerImpl(createRunnerDeps(get, createSafeSet(set, get, token), storeState))

        startAnalyticsSession(storeState.exercise)
        syncWithTuner(nextSessionId, storeState.detector)
        set((s) => ({ ...getStartStateUpdates(s, storeState as ReadyState, runner, abortController, token), sessionId: nextSessionId }))
        syncWithTuner(token, storeState.detector)

        runner.run(abortController.signal).catch((err) => handleRunnerFailure(set, get, err, storeState.exercise))
      } catch (error) {
        set((s) => ({ ...s, error: toAppError(error), isStarting: false }))
      }
    },

    stop: async () => {
      cancelActiveRunner(get().state)
      await audioManager.cleanup()
      finalizeAnalyticsSession()
      set((s) => ({ ...s, ...getStopStateUpdates(s) }))
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
        if (event?.type) {
          updateStateFromEvent(set, event, currentToken)
        }
      }
    }
  }
})
