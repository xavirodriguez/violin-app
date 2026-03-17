/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing the lifecycle from exercise
 * selection to completion. It coordinates audio resources, real-time analysis,
 * and persistent progress tracking.
 */

'use client'

import { create } from 'zustand'
import { type PracticeState, type PracticeEvent, DetectedNote } from '@/lib/practice-core'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { PitchDetector } from '@/lib/pitch-detector'
import {
  WebAudioFrameAdapter,
  WebAudioLoopAdapter,
  PitchDetectorAdapter,
} from '@/lib/adapters/web-audio.adapter'
import { useSessionStore } from './session.store'
import { useProgressStore } from './progress.store'
import { useTunerStore } from './tuner-store'
import {
  PracticeSessionRunnerImpl,
  SessionRunnerDependencies,
  RunnerStore,
  RunnerAnalytics,
} from '@/lib/practice/session-runner'
import {
  transitions,
  PracticeStoreState,
  ReadyState,
  ActiveState,
} from '@/lib/practice/practice-states'
import {
  getInitialPracticeState,
  getUpdatedLiveObservations,
  updatePracticeState,
  ensureReadyState,
  handleRunnerFailure,
} from './practice-store-helpers'

import type { Exercise } from '@/lib/exercises/types'
import { Observation, NoteTechnique } from '@/lib/technique-types'

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

interface ResolveUpdateParams {
  currentState: PracticeStore
  partial: SafePartial
}

/**
 * Creates a safe state update function for the practice session.
 */
function createSafeSet(params: {
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void
  get: () => PracticeStore
  currentToken: string
}) {
  const { set, get, currentToken } = params
  return (partial: SafePartial) => {
    const isStale = get().sessionToken !== currentToken
    if (isStale) return
    set((currentState) => resolveSafeUpdate({ currentState, partial }))
  }
}

function resolveSafeUpdate(params: ResolveUpdateParams): Partial<PracticeStore> {
  const { currentState, partial } = params
  const next = typeof partial === 'function' ? partial(currentState) : partial
  const updates = computeStateUpdates({ currentState, next })

  return injectActiveStateUpdates({
    currentState,
    updates,
    practiceState: updates.practiceState,
  })
}

function computeStateUpdates(params: {
  currentState: PracticeStore
  next: Partial<SafeUpdate>
}): Partial<PracticeStore> {
  const { currentState, next } = params
  const practiceState = next.practiceState || currentState.practiceState
  const liveObs = practiceState
    ? getUpdatedLiveObservations(practiceState)
    : currentState.liveObservations

  return {
    ...next,
    practiceState,
    liveObservations: next.liveObservations ?? liveObs,
  }
}

function injectActiveStateUpdates(params: {
  currentState: PracticeStore
  updates: Partial<PracticeStore>
  practiceState: PracticeState | undefined
}): Partial<PracticeStore> {
  const { currentState, updates, practiceState } = params
  const status = currentState.state.status
  const isActive = status === 'active'

  if (isActive) {
    const activeState = currentState.state as ActiveState
    updates.state = {
      ...activeState,
      practiceState: (practiceState || activeState.practiceState) as PracticeState,
    }
  }
  return updates
}

/**
 * Creates the dependencies required for the PracticeSessionRunner.
 */
function createRunnerDeps(params: {
  get: () => PracticeStore
  safeSet: (partial: SafePartial) => void
  storeState: ReadyState
}): SessionRunnerDependencies {
  const { get, safeSet, storeState } = params
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

function buildRunnerStoreInterface(
  get: () => PracticeStore,
  safeSet: (partial: SafePartial) => void,
): RunnerStore {
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
    recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => {
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
    const hasSession = !!session
    if (hasSession) {
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
  const isActive = state.status === 'active'
  if (isActive) {
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
  const status = currentState.state.status
  const isCancellable = status === 'active' || status === 'ready'
  const nextState = isCancellable
    ? transitions.stop(currentState.state as ActiveState | ReadyState)
    : currentState.state

  return {
    state: nextState,
    practiceState: getIdleDomainState(currentState.practiceState),
    ...getCleanedResourcesState(),
  }
}

function getIdleDomainState(practiceState: PracticeState | undefined): PracticeState | undefined {
  if (!practiceState) return undefined
  return { ...practiceState, status: 'idle' }
}

function getCleanedResourcesState() {
  return {
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
function createAudioAdapters(resources: {
  context: { sampleRate: number }
  analyser: AnalyserNode
}) {
  const detector = new PitchDetectorAdapter(new PitchDetector(resources.context.sampleRate))
  const frameAdapter = new WebAudioFrameAdapter(resources.analyser)
  const audioLoop = new WebAudioLoopAdapter(frameAdapter)
  return { detector, audioLoop }
}

/**
 * Updates the store state based on a practice event if the session token is valid.
 */
function updateStateFromEvent(params: {
  set: (fn: (currentState: PracticeStore) => Partial<PracticeStore>) => void
  event: PracticeEvent
  token: string | undefined
}) {
  const { set, event, token } = params
  set((currentState) => {
    const isStale = currentState.sessionToken !== token
    if (isStale || !currentState.practiceState) return currentState
    const practiceState = updatePracticeState(currentState.practiceState, event)
    const observations = practiceState ? getUpdatedLiveObservations(practiceState) : []
    return { ...currentState, practiceState, liveObservations: observations }
  })
}

/**
 * Determines if the audio hardware can be initialized based on current state.
 */
function shouldInitialize(state: PracticeStoreState, isInitializing: boolean): boolean {
  const hasExercise = !!state.exercise
  const status = state.status
  const isCorrectStatus = status === 'idle' || status === 'error'
  const canInit = !isInitializing && hasExercise && isCorrectStatus

  return canInit
}

/**
 * Returns the state updates for a successful audio initialization.
 */
function getSuccessInitUpdates(params: {
  currentState: PracticeStore
  resources: { analyser: AnalyserNode }
  adapters: { detector: PitchDetectionPort; audioLoop: AudioLoopPort }
}): Partial<PracticeStore> {
  const { currentState, resources, adapters } = params
  const exercise = currentState.state.exercise!
  const nextState = transitions.ready({ ...adapters, exercise })
  return {
    ...currentState,
    ...adapters,
    state: nextState,
    analyser: resources.analyser,
    isInitializing: false,
  }
}

/**
 * Returns the state updates for a failed audio initialization.
 */
function getFailureInitUpdates(currentState: PracticeStore, err: unknown): Partial<PracticeStore> {
  const error = toAppError(err)
  const exercise = currentState.state.exercise
  return {
    ...currentState,
    error,
    isInitializing: false,
    state: transitions.error(error, exercise),
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

function beginAudioInitialization(
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void,
) {
  set((currentState) => ({
    ...currentState,
    isInitializing: true,
    error: undefined,
    state: transitions.initialize(currentState.state.exercise),
  }))
}

async function acquireAudioResources() {
  const deviceId = useTunerStore.getState().deviceId || undefined
  const resources = await audioManager.initialize(deviceId)
  const isOk = !!resources

  if (!isOk) {
    throw new Error('Audio resource acquisition failed')
  }

  return resources
}

async function attemptToStart(
  ready: ReadyState | undefined,
  commence: (ready: ReadyState) => Promise<void>,
  set: (partial: Partial<PracticeStore>) => void,
) {
  if (ready) {
    await commence(ready)
  } else {
    set({ isStarting: false })
  }
}

/**
 * Returns the state updates for starting a practice session.
 */
function getStartStateUpdates(params: {
  currentState: PracticeStore
  storeState: ReadyState
  runner: PracticeSessionRunnerImpl
  abort: AbortController
  token: string
}): Partial<PracticeStore> {
  const { currentState, storeState, runner, abort, token } = params
  const practiceState = updatePracticeState(currentState.practiceState, { type: 'START' })
  return {
    ...currentState,
    state: transitions.start(storeState, runner, abort),
    practiceState,
    sessionToken: token,
    isStarting: false,
    error: undefined,
  }
}

export const usePracticeStore = create<PracticeStore>((set, get) => {
  const commenceSession = async (ready: ReadyState) => {
    const token = crypto.randomUUID()
    const safeSet = createSafeSet({ set, get, currentToken: token })
    const deps = createRunnerDeps({ get, safeSet, storeState: ready })
    const runner = new PracticeSessionRunnerImpl(deps)
    const abort = new AbortController()

    initializeSessionState({ ready, runner, abort, token })
    runner
      .run(abort.signal)
      .catch((err) => handleRunnerFailure({ set, get, err, exercise: ready.exercise }))
  }

  const initializeSessionState = (params: {
    ready: ReadyState
    runner: PracticeSessionRunnerImpl
    abort: AbortController
    token: string
  }) => {
    const { ready, runner, abort, token } = params
    const nextSessionId = get().sessionId + 1
    startAnalyticsSession(ready.exercise)
    syncWithTuner(nextSessionId, ready.detector)
    set((currentState) => ({
      ...getStartStateUpdates({ currentState, storeState: ready, runner, abort, token }),
      sessionId: nextSessionId,
    }))
    syncWithTuner(token, ready.detector)
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

    setAutoStart: (enabled) => {
      const nextValue = enabled
      const updates = { autoStartEnabled: nextValue }
      set((currentState) => ({ ...currentState, ...updates }))
    },

    setNoteIndex: (index) => {
      const state = get().practiceState
      if (!state) return
      const updates = getResetStateForIndex(state, index)
      set((currentState) => ({ ...currentState, practiceState: updates }))
    },

    initializeAudio: async () => {
      const canInit = shouldInitialize(get().state, get().isInitializing)
      if (!canInit) return

      beginAudioInitialization(set)
      try {
        const resources = await acquireAudioResources()
        const adapters = createAudioAdapters(resources)
        set((currentState) => getSuccessInitUpdates({ currentState, resources, adapters }))
      } catch (err) {
        set((currentState) => getFailureInitUpdates(currentState, err))
      }
    },

    start: async () => {
      set({ isStarting: true, error: undefined })
      try {
        const readyParams = { getState: get, initializeAudio: get().initializeAudio }
        const ready = await ensureReadyState(readyParams)
        await attemptToStart(ready, commenceSession, set)
      } catch (error) {
        set((currentState) => ({ ...currentState, error: toAppError(error), isStarting: false }))
      }
    },

    stop: async () => {
      const activeState = get().state
      cancelActiveRunner(activeState)
      await audioManager.cleanup()

      finalizeAnalyticsSession()
      const updates = getStopStateUpdates(get())
      set((currentState) => ({ ...currentState, ...updates }))
    },

    reset: async () => {
      const current = get()
      await current.stop()
      set((currentState) => ({ ...currentState, ...getResetUpdates() }))
    },

    consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
      const currentToken = get().sessionToken
      for await (const event of pipeline) {
        if (get().sessionToken !== currentToken) break
        if (event?.type) {
          updateStateFromEvent({ set, event, token: currentToken })
        }
      }
    },
  }
})

function getResetStateForIndex(state: PracticeState, index: number): PracticeState {
  const total = state.exercise.notes.length
  const clamped = Math.max(0, Math.min(index, total - 1))
  const history: DetectedNote[] = []

  return {
    ...state,
    currentIndex: clamped,
    status: 'listening',
    holdDuration: 0,
    detectionHistory: history,
  }
}

function getResetUpdates() {
  const idleState: PracticeStoreState = {
    status: 'idle',
    exercise: undefined,
    error: undefined,
  }

  return {
    state: idleState,
    practiceState: undefined,
    error: undefined,
    liveObservations: [],
    sessionToken: undefined,
  }
}
