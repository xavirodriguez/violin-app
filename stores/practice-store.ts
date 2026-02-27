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
  type PracticeState,
  type PracticeEvent,
} from '@/lib/practice-core'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { PitchDetector } from '@/lib/pitch-detector'
import { WebAudioFrameAdapter, WebAudioLoopAdapter, PitchDetectorAdapter } from '@/lib/adapters/web-audio.adapter'
import { useSessionStore } from './session.store'
import { useProgressStore } from './progress.store'
import { useTunerStore } from './tuner-store'
import { PracticeSessionRunnerImpl, SessionRunnerDependencies, RunnerStore, RunnerAnalytics } from '@/lib/practice/session-runner'
import { transitions, PracticeStoreState, ReadyState, ActiveState } from '@/lib/practice/practice-states'
import {
  getInitialPracticeState,
  getUpdatedLiveObservations,
  updatePracticeState
} from './practice-store-helpers'

import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'

/**
 * Main store for managing the practice mode lifecycle and real-time audio pipeline.
 */
export interface PracticeStore {
  state: PracticeStoreState
  practiceState: PracticeState | undefined
  error: AppError | undefined
  liveObservations: Observation[]
  autoStartEnabled: boolean
  analyser: AnalyserNode | undefined
  audioLoop: AudioLoopPort | undefined
  detector: PitchDetectionPort | undefined
  isStarting: boolean
  isInitializing: boolean
  sessionToken: string | undefined
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

type SafeUpdate = Pick<PracticeStore, 'practiceState' | 'liveObservations' | 'error'>
type SafePartial = Partial<SafeUpdate> | ((s: PracticeStore) => Partial<SafeUpdate>)

/**
 * Creates a safe state update function for the practice session.
 */
function createSafeSet(
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void,
  get: () => PracticeStore,
  currentToken: string
) {
  return (partial: SafePartial) => {
    if (get().sessionToken !== currentToken) return
    set((currentState) => resolveSafeUpdate(currentState, partial))
  }
}

function resolveSafeUpdate(currentState: PracticeStore, partial: SafePartial): Partial<PracticeStore> {
  const next = typeof partial === 'function' ? partial(currentState) : partial
  const practiceState = next.practiceState || currentState.practiceState
  const liveObservations = practiceState ? getUpdatedLiveObservations(practiceState) : currentState.liveObservations

  const updates: Partial<PracticeStore> = {
    ...next,
    practiceState,
    liveObservations: next.liveObservations ?? liveObservations,
  }

  return injectActiveStateUpdates(currentState, updates, practiceState)
}

function injectActiveStateUpdates(
  currentState: PracticeStore,
  updates: Partial<PracticeStore>,
  practiceState: PracticeState | undefined
): Partial<PracticeStore> {
  if (currentState.state.status === 'active') {
    updates.state = {
      ...currentState.state,
      practiceState: practiceState || currentState.state.practiceState
    }
  }
  return updates
}

/**
 * Creates the dependencies required for the PracticeSessionRunner.
 */
function createRunnerDeps(
  get: () => PracticeStore,
  safeSet: (partial: SafePartial) => void,
  storeState: ReadyState
): SessionRunnerDependencies {
  return {
    audioLoop: storeState.audioLoop,
    detector: storeState.detector,
    exercise: storeState.exercise,
    sessionStartTime: Date.now(),
    store: buildRunnerStoreInterface(get, safeSet),
    analytics: buildRunnerAnalyticsInterface(),
    updatePitch: (pitch, confidence) => {
      useTunerStore.getState().updatePitch(pitch, confidence)
    },
  }
}

function buildRunnerStoreInterface(get: () => PracticeStore, safeSet: (partial: SafePartial) => void): RunnerStore {
  return {
    getState: () => ({
      practiceState: get().practiceState,
      liveObservations: get().liveObservations,
    }),
    setState: (partial: SafePartial) => safeSet(partial),
    stop: async () => {
      await get().stop()
    },
  }
}

function buildRunnerAnalyticsInterface(): RunnerAnalytics {
  return {
    recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => {
      useSessionStore.getState().recordAttempt(index, pitch, cents, inTune)
    },
    recordNoteCompletion: (index: number, time: number, technique: any) => {
      useSessionStore.getState().recordCompletion(index, time, technique)
    },
    endSession: finalizeAnalyticsSession,
  }
}

/**
 * Synchronizes the practice session state with the TunerStore.
 */
function syncWithTuner(token: string | number, detector: PitchDetectionPort | undefined) {
  const detectorInstance = (detector as PitchDetectorAdapter)?.detector || undefined
  useTunerStore.setState({
    state: { kind: 'LISTENING', sessionToken: String(token) },
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
function getStopStateUpdates(currentState: PracticeStore): Partial<PracticeStore> {
  const isCancellable = currentState.state.status === 'active' || currentState.state.status === 'ready'
  return {
    state: isCancellable ? transitions.stop(currentState.state as ActiveState | ReadyState) : currentState.state,
    practiceState: currentState.practiceState ? { ...currentState.practiceState, status: 'idle' } : undefined,
    analyser: undefined,
    audioLoop: undefined,
    detector: undefined,
    liveObservations: [],
    sessionToken: undefined,
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
  set: (fn: (currentState: PracticeStore) => Partial<PracticeStore>) => void,
  event: PracticeEvent,
  token: string | undefined
) {
  set((currentState) => {
    if (currentState.sessionToken !== token || !currentState.practiceState) return currentState
    const practiceState = updatePracticeState(currentState.practiceState, event)
    return {
      ...currentState,
      practiceState,
      liveObservations: practiceState ? getUpdatedLiveObservations(practiceState) : [],
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
  currentState: PracticeStore,
  resources: { analyser: AnalyserNode },
  adapters: { detector: PitchDetectionPort; audioLoop: AudioLoopPort }
): Partial<PracticeStore> {
  return {
    ...currentState,
    ...adapters,
    state: transitions.ready({ ...adapters, exercise: currentState.state.exercise! }),
    analyser: resources.analyser,
    isInitializing: false,
  }
}

/**
 * Returns the state updates for a failed audio initialization.
 */
function getFailureInitUpdates(currentState: PracticeStore, err: unknown): Partial<PracticeStore> {
  const error = toAppError(err)
  return {
    ...currentState,
    error,
    isInitializing: false,
    state: transitions.error(error, currentState.state.exercise),
  }
}

/**
 * Starts the analytics session for the given exercise.
 */
function startAnalyticsSession(exercise: Exercise | undefined) {
  if (!exercise) return
  try {
    useSessionStore.getState().start(exercise.id, exercise.name, 'practice')
  } catch (error) {
    console.error('[PracticeStore] Failed to start session', error)
  }
}

/**
 * Handles terminal failures in the session runner.
 */
function handleRunnerFailure(
  set: (fn: (currentState: PracticeStore) => Partial<PracticeStore>) => void,
  get: () => PracticeStore,
  err: unknown,
  exercise: Exercise | undefined
) {
  const isAbort = err && typeof err === 'object' && 'name' in err && (err as Error).name === 'AbortError'
  if (!isAbort) {
    console.error('[PracticeStore] Session runner failed:', err)
    const error = toAppError(err)
    set((currentState) => ({ ...currentState, error, state: transitions.error(error, exercise) }))
    void get().stop()
  }
}

/**
 * Returns the state updates for starting a practice session.
 */
function getStartStateUpdates(
  currentState: PracticeStore,
  storeState: ReadyState,
  runner: PracticeSessionRunnerImpl,
  abortController: AbortController,
  token: string
): Partial<PracticeStore> {
  const practiceState = updatePracticeState(currentState.practiceState, { type: 'START' })
  return {
    ...currentState,
    state: transitions.start(storeState, runner, abortController),
    practiceState,
    sessionToken: token,
    isStarting: false,
    error: undefined,
  }
}

export const usePracticeStore = create<PracticeStore>((set, get) => {
  const ensureReadyState = async (): Promise<ReadyState | undefined> => {
    let storeState = get().state
    if (storeState.status === 'idle' && storeState.exercise) {
      await get().initializeAudio()
      storeState = get().state
    }
    return storeState.status === 'ready' ? storeState : undefined
  }

  const commenceSession = async (ready: ReadyState) => {
    const token = crypto.randomUUID()
    const nextSessionId = get().sessionId + 1
    const abortController = new AbortController()
    const safeSet = createSafeSet(set, get, token)
    const deps = createRunnerDeps(get, safeSet, ready)
    const runner = new PracticeSessionRunnerImpl(deps)

    startAnalyticsSession(ready.exercise)
    syncWithTuner(nextSessionId, ready.detector)
    set((currentState) => ({
      ...getStartStateUpdates(currentState, ready, runner, abortController, token),
      sessionId: nextSessionId
    }))
    syncWithTuner(token, ready.detector)

    runner.run(abortController.signal).catch((err) => handleRunnerFailure(set, get, err, ready.exercise))
  }

  return {
    state: { status: 'idle', exercise: undefined, error: undefined },
    practiceState: undefined,
    error: undefined,
    liveObservations: [],
    autoStartEnabled: false,
    isStarting: false,
    isInitializing: false,
    sessionToken: undefined,
    sessionId: 0,
    analyser: undefined,
    audioLoop: undefined,
    detector: undefined,

    loadExercise: async (exercise) => {
      await get().stop()
      set((currentState) => ({
        ...currentState,
        practiceState: getInitialPracticeState(exercise),
        state: { status: 'idle', exercise, error: undefined },
        error: undefined,
        liveObservations: [],
        sessionToken: undefined,
      }))
    },

    setAutoStart: (enabled) => set((currentState) => ({ ...currentState, autoStartEnabled: enabled })),

    setNoteIndex: (index) => {
      const practiceState = get().practiceState
      if (!practiceState) return
      set((currentState) => ({
        ...currentState,
        practiceState: {
          ...practiceState,
          currentIndex: Math.max(0, Math.min(index, practiceState.exercise.notes.length - 1)),
          status: 'listening',
          holdDuration: 0,
          detectionHistory: [],
        },
      }))
    },

    initializeAudio: async () => {
      if (!shouldInitialize(get().state, get().isInitializing)) return
      set((currentState) => ({
        ...currentState,
        isInitializing: true,
        error: undefined,
        state: transitions.initialize(currentState.state.exercise)
      }))
      try {
        const resources = await audioManager.initialize(useTunerStore.getState().deviceId || undefined)
        const adapters = createAudioAdapters(resources)
        set((currentState) => getSuccessInitUpdates(currentState, resources, adapters))
      } catch (err) {
        set((currentState) => getFailureInitUpdates(currentState, err))
      }
    },

    start: async () => {
      set({ isStarting: true, error: undefined })
      try {
        const ready = await ensureReadyState()
        if (ready) {
          await commenceSession(ready)
        } else {
          set({ isStarting: false })
        }
      } catch (error) {
        set((currentState) => ({ ...currentState, error: toAppError(error), isStarting: false }))
      }
    },

    stop: async () => {
      cancelActiveRunner(get().state)
      await audioManager.cleanup()
      finalizeAnalyticsSession()
      set((currentState) => ({ ...currentState, ...getStopStateUpdates(currentState) }))
    },

    reset: async () => {
      await get().stop()
      set((currentState) => ({
        ...currentState,
        state: { status: 'idle', exercise: undefined, error: undefined },
        practiceState: undefined,
        error: undefined,
        liveObservations: [],
        sessionToken: undefined,
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
