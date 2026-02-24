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
import { PracticeSessionRunnerImpl, SessionRunnerDependencies } from '@/lib/practice/session-runner'
import { transitions, PracticeStoreState, ReadyState, ActiveState } from '@/lib/practice/practice-states'

import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'

/**
 * Main store for managing the practice mode lifecycle and real-time audio pipeline.
 *
 * @public
 */
export interface PracticeStore {
  state: PracticeStoreState
  practiceState: PracticeState | null
  error: AppError | null
  liveObservations: Observation[]
  autoStartEnabled: boolean
  analyser: AnalyserNode | null
  audioLoop: AudioLoopPort | null
  detector: PitchDetectionPort | null
  isStarting: boolean
  isInitializing: boolean
  sessionToken: string | null
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
  if (state.status === 'idle' || state.status === 'correct' || state.status === 'completed') {
    return state.lastObservations || []
  }
  const targetNote = state.exercise.notes[state.currentIndex]
  if (!targetNote) return []
  const targetPitchName = formatPitchName(targetNote.pitch)
  return calculateLiveObservations(state.detectionHistory, targetPitchName)
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
    set((s) => {
      const next = typeof partial === 'function' ? partial(s) : partial
      const ps = next.practiceState || s.practiceState
      const liveObs = ps ? getUpdatedLiveObservations(ps) : s.liveObservations

      const updates: Partial<PracticeStore> = {
        ...next,
        practiceState: ps,
        liveObservations: next.liveObservations ?? liveObs,
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
): SessionRunnerDependencies {
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
      recordNoteAttempt: (index, pitch, cents, inTune) => {
        useSessionStore.getState().recordAttempt(index, pitch, cents, inTune)
      },
      recordNoteCompletion: (index, time, technique) => {
        useSessionStore.getState().recordCompletion(index, time, technique)
      },
      endSession: finalizeAnalyticsSession,
    },
    updatePitch: (pitch, confidence) => {
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
  runner: PracticeSessionRunnerImpl,
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
  const ensureReadyState = async (): Promise<ReadyState | null> => {
    let storeState = get().state
    if (storeState.status === 'idle' && storeState.exercise) {
      await get().initializeAudio()
      storeState = get().state
    }
    return storeState.status === 'ready' ? storeState : null
  }

  const commenceSession = async (ready: ReadyState) => {
    const token = crypto.randomUUID()
    const nextSessionId = get().sessionId + 1
    const abortController = new AbortController()
    const deps = createRunnerDeps(get, createSafeSet(set, get, token), ready)
    const runner = new PracticeSessionRunnerImpl(deps)

    startAnalyticsSession(ready.exercise)
    syncWithTuner(nextSessionId, ready.detector)
    set((s) => ({ ...getStartStateUpdates(s, ready, runner, abortController, token), sessionId: nextSessionId }))
    syncWithTuner(token, ready.detector)

    runner.run(abortController.signal).catch((err) => handleRunnerFailure(set, get, err, ready.exercise))
  }

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
      const ps = get().practiceState
      if (!ps) return
      set((s) => ({
        ...s,
        practiceState: {
          ...ps,
          currentIndex: Math.max(0, Math.min(index, ps.exercise.notes.length - 1)),
          status: 'listening',
          holdDuration: 0,
          detectionHistory: [],
        },
      }))
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
        const ready = await ensureReadyState()
        if (ready) {
          await commenceSession(ready)
        } else {
          set({ isStarting: false })
        }
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
