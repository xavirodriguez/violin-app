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
