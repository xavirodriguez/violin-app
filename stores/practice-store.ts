/**
 * PracticeStore
 *
 * Orchestrates a violin practice session, managing the lifecycle from exercise
 * selection to completion. It coordinates audio resources, real-time analysis,
 * and persistent progress tracking.
 */

'use client'

import { create } from 'zustand'
import { allExercises } from '@/lib/exercises'
import {
  type PracticeState,
  type PracticeEvent,
  type PracticeStatus,
  type PracticeUIEvent,
} from '@/lib/domain/practice'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import { createPitchDetectorForDifficulty } from '@/lib/pitch-detector'
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
import { Observation } from '@/lib/technique-types'
import { validateExercise } from '@/lib/exercises/validation'
import { derivePracticeState } from '@/lib/practice/practice-utils'

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
  jumpToNote: (index: number) => void
  initializeAudio: () => Promise<void>
  initialize: () => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => Promise<void>
  dispatch: (event: PracticeUIEvent) => Promise<void>
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

type SafeUpdate = Pick<PracticeStore, 'practiceState' | 'liveObservations' | 'error'>
type SafePartial = SafeUpdate | Partial<SafeUpdate> | ((s: PracticeStore) => Partial<SafeUpdate>)

interface ResolveUpdateParams {
  currentState: PracticeStore
  partial: SafePartial
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
    set((currentState) => {
      const updates = getStartStateUpdates({
        currentState,
        storeState: ready,
        runner,
        abort,
        token,
      })
      return { ...updates, sessionId: nextSessionId }
    })
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
      try {
        await get().stop()
        const validated = validateExercise(exercise)
        const updates = getExerciseLoadUpdates(validated)
        set((currentState) => ({
          ...currentState,
          ...updates,
        }))

        if (get().autoStartEnabled) {
          await get().start()
        }
      } catch (err) {
        const error = toAppError(err)
        set((currentState) => ({
          ...currentState,
          error,
          state: transitions.error(error, exercise as Exercise),
        }))
      }
    },

    setAutoStart: (enabled) => {
      const nextValue = enabled
      const updates = { autoStartEnabled: nextValue }
      set((currentState) => ({ ...currentState, ...updates }))
    },

    jumpToNote: (index) => {
      const state = get().practiceState
      if (!state || get().isStarting) return

      const wasActive = get().state.status === 'active'
      const jumpEvent: PracticeEvent = { type: 'JUMP_TO_NOTE', payload: { index } }

      if (wasActive) {
        get()
          .stop()
          .then(() => {
            updateStateFromEvent({ set, event: jumpEvent, token: get().sessionToken })
            return get().start()
          })
          .catch((err) => console.error('[PracticeStore] Failed to restart after index change:', err))
      } else {
        updateStateFromEvent({ set, event: jumpEvent, token: get().sessionToken })
      }
    },

    initializeAudio: async () => {
      const current = get()
      const canInit = shouldInitialize(current.state, current.isInitializing)
      if (!canInit) return

      beginAudioInitialization(set)
      await performAudioInitialization(set, get)
    },

    initialize: async () => {
      const { practiceState, loadExercise } = get()
      if (!practiceState && allExercises.length > 0) {
        await loadExercise(allExercises[0])
      }
    },

    start: async () => {
      set({ isStarting: true, error: undefined })
      try {
        const readyParams = { getState: get, initializeAudio: get().initializeAudio }
        const ready = await ensureReadyState(readyParams)
        await attemptToStart(ready, commenceSession, set)
      } catch (error) {
        set((currentState) => getStartFailureUpdates(currentState, error))
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

    dispatch: async (event: PracticeUIEvent) => {
      switch (event.type) {
        case 'START_SESSION':
          await get().start()
          break
        case 'STOP_SESSION':
          await get().stop()
          break
        case 'RESET_SESSION':
          await get().reset()
          break
        case 'TOGGLE_AUTO_START':
          get().setAutoStart(event.payload.enabled)
          break
        case 'JUMP_TO_NOTE':
          get().jumpToNote(event.payload.index)
          break
        case 'LOAD_EXERCISE':
          await get().loadExercise(event.payload.exercise)
          break
      }
    },

    consumePipelineEvents: async (pipeline: PracticeEventPipeline) => {
      const currentToken = get().sessionToken
      for await (const event of pipeline) {
        const isStillValid = get().sessionToken === currentToken
        if (!isStillValid) break
        if (event?.type) {
          updateStateFromEvent({ set, event, token: currentToken })
        }
      }
    },
  }
})

/**
 * Selector hook to access derived practice state.
 */
export const useDerivedPracticeState = () => {
  const practiceState = usePracticeStore((s) => s.practiceState)
  return derivePracticeState(practiceState)
}

type PracticeEventPipeline = AsyncIterable<PracticeEvent>

/**
 * Creates a safe state update function for the practice session.
 * @internal
 */
export function createSafeSet(params: {
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void
  get: () => PracticeStore
  currentToken: string
}) {
  const { set, get, currentToken } = params
  const safeSet = (partial: SafePartial) => {
    const isStale = get().sessionToken !== currentToken
    if (isStale) return
    set((currentState) => resolveSafeUpdate({ currentState, partial }))
  }

  return safeSet
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
  const observations = practiceState
    ? getUpdatedLiveObservations(practiceState)
    : currentState.liveObservations

  const result = {
    ...next,
    practiceState,
    liveObservations: next.liveObservations ?? observations,
  }
  return result
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
  const tolerance = calculateCentsTolerance()
  const deps: SessionRunnerDependencies = {
    audioLoop: storeState.audioLoop,
    detector: storeState.detector,
    exercise: storeState.exercise,
    sessionStartTime: Date.now(),
    store: buildRunnerStoreInterface(get, safeSet),
    analytics: buildRunnerAnalyticsInterface(),
    updatePitch: (p, c) => useTunerStore.getState().updatePitch(p, c),
    centsTolerance: tolerance,
  }

  return deps
}

/** @internal */
export function calculateCentsTolerance(): number {
  const { intonationSkill } = useProgressStore.getState()
  const baseTolerance = 35
  const skillBonus = (intonationSkill / 100) * 25
  const adaptiveTolerance = Math.round(baseTolerance - skillBonus)
  const tolerance = Math.max(15, adaptiveTolerance)

  return tolerance
}

function buildRunnerStoreInterface(
  get: () => PracticeStore,
  safeSet: (partial: SafePartial) => void,
): RunnerStore {
  const storeInterface: RunnerStore = {
    getState: () => ({
      practiceState: get().practiceState,
      liveObservations: get().liveObservations,
    }),
    dispatch: (event: PracticeEvent) => {
      const currentToken = get().sessionToken
      updateStateFromEvent({
        set: (fn) => safeSet(fn as any),
        event,
        token: currentToken,
      })

      // Handle completion side effects
      const state = get().practiceState
      if (state?.status === 'completed') {
        finalizeAnalyticsSession()
        get()
          .stop()
          .catch((err) => console.error('[PracticeStore] Failed to stop after completion:', err))
      }
    },
    stop: async () => {
      await get().stop()
    },
  }

  return storeInterface
}

function buildRunnerAnalyticsInterface(): RunnerAnalytics {
  const analyticsInterface: RunnerAnalytics = {
    recordNoteAttempt: (params) => {
      const { index, pitch, cents, inTune } = params
      useSessionStore.getState().recordAttempt({ noteIndex: index, pitch, cents, inTune })
    },
    recordNoteCompletion: (params) => {
      const { index, time, technique } = params
      useSessionStore.getState().recordCompletion({ noteIndex: index, timeMs: time, technique })
    },
    endSession: finalizeAnalyticsSession,
  }

  return analyticsInterface
}

/**
 * Synchronizes the practice session state with the TunerStore.
 */
function syncWithTuner(token: string | number, detector: PitchDetectionPort | undefined) {
  const adapter = detector as PitchDetectorAdapter
  const detectorInstance = adapter?.detector || undefined
  const tunerUpdate = {
    state: { kind: 'LISTENING', sessionToken: String(token) } as const,
    detector: detectorInstance,
  }

  useTunerStore.setState(tunerUpdate)
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
      const active = state as ActiveState
      active.abortController.abort()
      active.runner.cancel()
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

  const result = {
    state: nextState,
    practiceState: getIdleDomainState(currentState.practiceState),
    ...getCleanedResourcesState(),
  }

  return result
}

function getIdleDomainState(practiceState: PracticeState | undefined): PracticeState | undefined {
  if (!practiceState) {
    return undefined
  }
  const idleStatus: PracticeStatus = 'idle'
  const result = { ...practiceState, status: idleStatus }

  return result
}

function getCleanedResourcesState() {
  const cleanedState = {
    analyser: undefined,
    audioLoop: undefined,
    detector: undefined,
    liveObservations: [],
    sessionToken: undefined,
    isStarting: false,
    isInitializing: false,
  }

  return cleanedState
}

/**
 * Creates the audio adapters required for the practice pipeline.
 *
 * @param resources - Audio context and analyser node.
 * @param difficulty - Optional difficulty level for frequency range configuration.
 * @returns The detector and audio loop adapters.
 */
function createAudioAdapters(params: {
  resources: { context: { sampleRate: number }; analyser: AnalyserNode }
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
}) {
  const { resources, difficulty = 'Beginner' } = params
  const sampleRate = resources.context.sampleRate
  const detector = new PitchDetectorAdapter(
    createPitchDetectorForDifficulty(difficulty, sampleRate),
  )
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

  const updates = {
    ...currentState,
    ...adapters,
    state: nextState,
    analyser: resources.analyser,
    isInitializing: false,
  }

  return updates
}

/**
 * Returns the state updates for a failed audio initialization.
 */
function getFailureInitUpdates(currentState: PracticeStore, err: unknown): Partial<PracticeStore> {
  const error = toAppError(err)
  const exercise = currentState.state.exercise
  const updates = {
    ...currentState,
    error,
    isInitializing: false,
    state: transitions.error(error, exercise),
  }

  return updates
}

/**
 * Starts the analytics session for the given exercise.
 */
function startAnalyticsSession(exercise: Exercise | undefined) {
  if (!exercise) return
  try {
    const sessionType = 'practice'
    useSessionStore.getState().start(exercise.id, exercise.name, sessionType)
  } catch (error) {
    console.error('[PracticeStore] Failed to start session', error)
  }
}

function beginAudioInitialization(set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void) {
  set((currentState) => {
    const initStatus = transitions.initialize(currentState.state.exercise)
    const updates = {
      ...currentState,
      isInitializing: true,
      error: undefined,
      state: initStatus,
    }
    return updates
  })
}

async function acquireAudioResources() {
  const tunerState = useTunerStore.getState()
  const deviceId = tunerState.deviceId || undefined
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
  const hasReadyState = !!ready
  if (hasReadyState) {
    await commence(ready!)
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
  const startIndex = currentState.practiceState?.currentIndex ?? 0
  const startEvent: PracticeEvent = { type: 'START', payload: { startIndex } }
  const practiceState = updatePracticeState(currentState.practiceState, startEvent)

  return {
    ...currentState,
    state: transitions.start(storeState, runner, abort, startIndex),
    practiceState,
    sessionToken: token,
    isStarting: false,
    error: undefined,
  }
}


function getExerciseLoadUpdates(exercise: Exercise) {
  const resetUpdates = {
    practiceState: getInitialPracticeState(exercise),
    state: { status: 'idle' as const, exercise, error: undefined },
    error: undefined,
    liveObservations: [],
    sessionToken: undefined,
  }

  return resetUpdates
}

async function performAudioInitialization(
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void,
  get: () => PracticeStore,
) {
  try {
    const resources = await acquireAudioResources()
    const difficulty = get().state.exercise?.difficulty
    const adapters = createAudioAdapters({ resources, difficulty })
    set(() => getSuccessInitUpdates({ currentState: get(), resources, adapters }))
  } catch (err) {
    set(() => getFailureInitUpdates(get(), err))
  }
}

function getStartFailureUpdates(
  currentState: PracticeStore,
  error: unknown,
): Partial<PracticeStore> {
  const appError = toAppError(error)
  const exercise = currentState.state.exercise
  const updates = {
    ...currentState,
    error: appError,
    isStarting: false,
    state: transitions.error(appError, exercise),
  }

  return updates
}

function getResetUpdates() {
  const idleState = createIdleStoreState()
  const result = assembleResetUpdates(idleState)

  return result
}

function createIdleStoreState(): PracticeStoreState {
  const idle: PracticeStoreState = {
    status: 'idle',
    exercise: undefined,
    error: undefined,
  }
  return idle
}

function assembleResetUpdates(idleState: PracticeStoreState) {
  const updates = {
    state: idleState,
    practiceState: undefined,
    error: undefined,
    liveObservations: [],
    sessionToken: undefined,
  }
  return updates
}
