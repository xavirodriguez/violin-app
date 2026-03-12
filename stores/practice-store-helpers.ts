/**
 * PracticeStore Helpers
 *
 * Standalone pure functions and utilities for the PracticeStore to maintain Clean Code compliance.
 */

import {
  formatPitchName,
  reducePracticeEvent,
  type PracticeState,
  type PracticeEvent,
  DetectedNote
} from '@/lib/practice-core'
import { calculateLiveObservations } from '@/lib/live-observations'
import { Observation } from '@/lib/technique-types'
import type { Exercise } from '@/lib/exercises/types'
import { FixedRingBuffer } from '@/lib/domain/data-structures'
import { ReadyState, transitions } from '@/lib/practice/practice-states'
import { PracticeStore } from './practice-store'
import { toAppError } from '@/lib/errors/app-error'

/**
 * Returns the initial domain state for a given exercise.
 */
export function getInitialPracticeState(exercise: Exercise): PracticeState {
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
export function getUpdatedLiveObservations(state: PracticeState): Observation[] {
  const terminalStates = ['idle', 'correct', 'completed']
  if (terminalStates.includes(state.status)) {
    return state.lastObservations || []
  }
  return computeActiveObservations(state)
}

function computeActiveObservations(state: PracticeState): Observation[] {
  const targetNote = state.exercise.notes[state.currentIndex]
  if (!targetNote) return []
  const targetPitchName = formatPitchName(targetNote.pitch)
  return calculateLiveObservations(state.detectionHistory, targetPitchName)
}

/**
 * Updates the domain practice state based on an event.
 */
export function updatePracticeState(
  currentState: PracticeState | undefined,
  event: PracticeEvent
): PracticeState | undefined {
  if (!currentState) return undefined
  return reducePracticeEvent(currentState, event)
}

/**
 * Creates a new history buffer with the latest detection.
 */
export function updateDetectionHistory(
  history: readonly DetectedNote[],
  payload: DetectedNote
): readonly DetectedNote[] {
  const buffer = new FixedRingBuffer<DetectedNote, 10>(10)
  buffer.push(...history.slice().reverse(), payload)
  return buffer.toArray()
}

/**
 * Ensures the store is in a ready state by initializing audio if needed.
 */
export async function ensureReadyState(params: {
  getState: () => PracticeStore
  initializeAudio: () => Promise<void>
}): Promise<ReadyState | undefined> {
  const { getState, initializeAudio } = params
  let storeState = getState().state
  if (storeState.status === 'idle' && storeState.exercise) {
    await initializeAudio()
    storeState = getState().state
  }
  return storeState.status === 'ready' ? storeState : undefined
}

/**
 * Parameters for handling terminal failures in the session runner.
 */
export interface RunnerFailureParams {
  set: (fn: (currentState: PracticeStore) => Partial<PracticeStore>) => void
  get: () => PracticeStore
  err: unknown
  exercise: Exercise | undefined
}

/**
 * Handles terminal failures in the session runner.
 */
export function handleRunnerFailure(params: RunnerFailureParams) {
  const { set, get, err, exercise } = params
  const isAbort = err && typeof err === 'object' && 'name' in err && (err as Error).name === 'AbortError'
  if (!isAbort) {
    console.error('[PracticeStore] Session runner failed:', err)
    const error = toAppError(err)
    set((currentState) => ({ ...currentState, error, state: transitions.error(error, exercise) }))
    void get().stop()
  }
}
