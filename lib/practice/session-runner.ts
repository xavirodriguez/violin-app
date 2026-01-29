import { formatPitchName, type PracticeState } from '@/lib/practice-core'
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'
import { handlePracticeEvent } from './practice-event-sink'
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
    setState: (fn: (state: SessionState) => Partial<SessionState>) => void
    stop: () => Promise<void>
  }
  analytics: {
    recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void
    recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void
    endSession: () => void
  }
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
 * Runs the asynchronous practice loop, processing audio events and updating the store.
 *
 * @remarks
 * This function is decoupled from the Zustand store's internal structure,
 * relying instead on a minimal dependency interface. This allows for better
 * testability and prevents closure-related memory leaks or race conditions.
 */
export async function runPracticeSession({
  signal,
  sessionId,
  store,
  analytics,
  detector,
  exercise,
  sessionStartTime,
}: SessionRunnerDependencies) {
  const localSessionId = sessionId
  let lastDispatchedNoteIndex = -1
  let currentNoteStartedAt = Date.now()

  const targetNoteSelector = () => {
    const state = store.getState().practiceState
    if (!state) return null
    return state.exercise.notes[state.currentIndex] ?? null
  }

  const currentIndexSelector = () => {
    return store.getState().practiceState?.currentIndex ?? 0
  }

  const rawPitchStream = createRawPitchStream(store.getState().analyser!, detector, signal)
  const practiceEventPipeline = createPracticeEventPipeline(
    rawPitchStream,
    targetNoteSelector,
    currentIndexSelector,
    {
      exercise,
      sessionStartTime,
      bpm: 60,
    },
    signal,
  )

  console.debug('[PIPELINE] Loop started', { sessionId, localSessionId })

  try {
    for await (const event of practiceEventPipeline) {
      if (signal.aborted) {
        console.debug('[PIPELINE] Loop terminated via AbortSignal', { sessionId })
        break
      }

      if (!event) {
        console.warn('[PIPELINE] Received null event')
        continue
      }

      const currentState = store.getState().practiceState
      if (!currentState) {
        console.error('[PIPELINE] State is null during event processing', event)
        continue
      }

      // Handle Note Matched side effects (Analytics)
      if (event.type === 'NOTE_MATCHED') {
        const result = handleMatchedNoteSideEffects(
          event,
          currentState,
          lastDispatchedNoteIndex,
          currentNoteStartedAt,
          analytics,
        )
        lastDispatchedNoteIndex = result.lastDispatchedNoteIndex
        currentNoteStartedAt = result.currentNoteStartedAt
      }

      // Dispatch event to sink for state reduction
      handlePracticeEvent(event, store, () => void store.stop(), analytics)
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
