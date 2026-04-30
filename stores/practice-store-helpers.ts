/**
 * Helper functions for the PracticeStore to keep the main store file clean.
 */

import {
  type PracticeState,
  type PracticeEvent,
  reducePracticeEvent,
  formatPitchName,
} from '@/lib/domain/practice'
import { toAppError } from '@/lib/errors/app-error'
import { transitions, ReadyState, PracticeStoreState } from '@/lib/practice/practice-states'
import type { Exercise } from '@/lib/domain/exercise'
import { Observation } from '@/lib/technique-types'
import { PracticeStore } from './practice-store'
import { calculateLiveObservations } from '@/lib/live-observations'

/**
 * Returns the initial domain state for a new practice session.
 */
export function getInitialPracticeState(exercise: Exercise): PracticeState {
  const initialState: PracticeState = {
    status: 'idle',
    exercise,
    currentIndex: 0,
    detectionHistory: [],
    holdDuration: 0,
    lastObservations: [],
    perfectNoteStreak: 0,
  }

  return initialState
}

/**
 * Extracts live observations from the current practice state.
 */
export function getUpdatedLiveObservations(state: PracticeState): Observation[] {
  const history = state.detectionHistory
  const note = state.exercise.notes[state.currentIndex]
  if (!note) return []

  const pitch = formatPitchName(note.pitch)
  const observations = calculateLiveObservations(history, pitch)

  return observations
}

/**
 * Orchestrates domain state updates using the pure practice reducer.
 */
export function updatePracticeState(
  state: PracticeState | undefined,
  event: PracticeEvent,
): PracticeState | undefined {
  if (!state) {
    return undefined
  }

  const updatedState = reducePracticeEvent(state, event)
  const result = updatedState

  return result
}

/**
 * Ensures the store is in a 'ready' state, initializing audio if necessary.
 */
export async function ensureReadyState(params: {
  getState: () => { state: PracticeStoreState }
  initializeAudio: () => Promise<void>
}): Promise<ReadyState | undefined> {
  const { getState, initializeAudio } = params
  const currentStatus = getState().state.status

  if (currentStatus === 'idle' || currentStatus === 'error') {
    await initializeAudio()
  }

  const nextStatus = getState().state.status
  const isReady = nextStatus === 'ready'
  const result = isReady ? (getState().state as ReadyState) : undefined

  return result
}

/**
 * Handles terminal failures in the session runner.
 */
export function handleRunnerFailure(params: {
  set: (fn: (s: PracticeStore) => Partial<PracticeStore>) => void
  get: () => { state: PracticeStoreState }
  err: unknown
  exercise: Exercise
}): void {
  const { set, err, exercise } = params
  const error = toAppError(err)
  const isAbort = error.message.includes('Aborted') || error.name === 'AbortError'

  if (isAbort) return

  console.error('[PracticeStore] Session runner failed:', err)
  set((currentState) => {
    const errorStatus = transitions.error(error, exercise)
    return {
      ...currentState,
      error,
      isStarting: false,
      state: errorStatus,
    }
  })
}
