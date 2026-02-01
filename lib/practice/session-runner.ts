import { formatPitchName, type PracticeState } from '@/lib/practice-core'
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'
import { handlePracticeEvent } from './practice-event-sink'
import { featureFlags } from '@/lib/feature-flags'
import type { PitchDetector } from '@/lib/pitch-detector'
import type { Exercise } from '@/lib/exercises/types'
import { NoteTechnique } from '../technique-types'

interface SessionState {
  practiceState: PracticeState | null
  analyser: AnalyserNode | null
}

interface SessionRunnerDependencies {
  signal: AbortSignal
  sessionId: number
  store: {
    getState: () => SessionState
    setState: (
      partial: SessionState | Partial<SessionState> | ((state: SessionState) => Partial<SessionState>),
      replace?: false,
    ) => void
    stop: () => Promise<void>
  }
  analytics: {
    recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void
    recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void
    endSession: () => void
  }
  updatePitch?: (pitch: number, confidence: number) => void
  detector: PitchDetector
  exercise: Exercise
  sessionStartTime: number
}

/**
 * Handles side effects for a matched note, such as updating analytics.
 */
function handleMatchedNoteSideEffects(
  event: Extract<import('@/lib/practice-core').PracticeEvent, { type: 'NOTE_MATCHED' }>,
  currentState: PracticeState,
  lastDispatchedNoteIndex: number,
  currentNoteStartedAt: number,
  analytics: SessionRunnerDependencies['analytics'],
): { lastDispatchedNoteIndex: number; currentNoteStartedAt: number } {
  const noteIndex = currentState.currentIndex
  const target = currentState.exercise.notes[noteIndex]

  if (target && noteIndex !== lastDispatchedNoteIndex) {
    const timeToComplete = Date.now() - currentNoteStartedAt
    const targetPitch = formatPitchName(target.pitch)

    analytics.recordNoteAttempt(noteIndex, targetPitch, 0, true)
    analytics.recordNoteCompletion(noteIndex, timeToComplete, event.payload?.technique)

    return {
      lastDispatchedNoteIndex: noteIndex,
      currentNoteStartedAt: Date.now(),
    }
  }

  return { lastDispatchedNoteIndex, currentNoteStartedAt }
}

/**
 * Processes a single practice event and handles side effects.
 * @internal
 */
function processSessionEvent(
  event: import('@/lib/practice-core').PracticeEvent,
  deps: SessionRunnerDependencies,
  state: { lastDispatchedNoteIndex: number; currentNoteStartedAt: number },
): { lastDispatchedNoteIndex: number; currentNoteStartedAt: number } {
  if (!event || !event.type) {
    console.warn('[INVALID EVENT]', event)
    return state
  }

  const currentState = deps.store.getState().practiceState
  if (!currentState) {
    console.error('[STATE NULL]', { event })
    return state
  }

  console.debug('[PIPELINE]', event)

  try {
    if (event.type === 'NOTE_DETECTED') {
      deps.updatePitch?.(event.payload.pitchHz, event.payload.confidence)

      // Accuracy Telemetry Evolution
      if (featureFlags.isEnabled('FEATURE_TELEMETRY_ACCURACY')) {
        console.log('[TELEMETRY] Pitch Accuracy:', {
          pitch: event.payload.pitch,
          cents: event.payload.cents,
          confidence: event.payload.confidence,
          timestamp: event.payload.timestamp,
        })
      }
    } else if (event.type === 'NO_NOTE_DETECTED') {
      deps.updatePitch?.(0, 0)
    }
  } catch (err) {
    console.warn('[PIPELINE] updatePitch failed', err)
  }

  if (deps.signal.aborted) return state

  let newState = { ...state }

  if (event.type === 'NOTE_MATCHED') {
    try {
      newState = handleMatchedNoteSideEffects(
        event,
        currentState,
        state.lastDispatchedNoteIndex,
        state.currentNoteStartedAt,
        deps.analytics,
      )
    } catch (err) {
      console.error('[PIPELINE] handleMatchedNoteSideEffects failed', err)
    }
  }

  if (!deps.signal.aborted) {
    try {
      handlePracticeEvent(event, deps.store, () => void deps.store.stop(), deps.analytics)
    } catch (err) {
      console.error('[PIPELINE] handlePracticeEvent failed', err)
    }
  }

  return newState
}

/**
 * Runs the asynchronous practice loop, processing audio events and updating the store.
 *
 * @remarks
 * This function is decoupled from the Zustand store's internal structure,
 * relying instead on a minimal dependency interface. This allows for better
 * testability and prevents closure-related memory leaks or race conditions.
 */
export async function runPracticeSession(deps: SessionRunnerDependencies) {
  const { signal, sessionId, detector, exercise, sessionStartTime } = deps
  let loopState = { lastDispatchedNoteIndex: -1, currentNoteStartedAt: Date.now() }

  const analyser = deps.store.getState().analyser
  if (!analyser) {
    console.error('[PIPELINE] Aborting: Analyser is null at start', { sessionId })
    return
  }

  const targetNoteSelector = () => {
    if (signal.aborted) return null
    const state = deps.store.getState().practiceState
    if (!state) return null
    return state.exercise.notes[state.currentIndex] ?? null
  }

  const currentIndexSelector = () => {
    if (signal.aborted) return 0
    return deps.store.getState().practiceState?.currentIndex ?? 0
  }

  const rawPitchStream = createRawPitchStream(analyser, detector, signal)
  const practiceEventPipeline = createPracticeEventPipeline(
    rawPitchStream,
    targetNoteSelector,
    currentIndexSelector,
    { exercise, sessionStartTime, bpm: 60 },
    signal,
  )

  console.debug('[PIPELINE] Loop started', { sessionId })

  try {
    for await (const event of practiceEventPipeline) {
      if (signal.aborted) break
      if (!event) {
        console.warn('[PIPELINE] Null event yielded from pipeline', { sessionId })
        continue
      }
      loopState = processSessionEvent(event, deps, loopState)
    }
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name !== 'AbortError') {
      throw err
    }
  } finally {
    console.debug('[PIPELINE] Loop exited', { sessionId })
  }
}
