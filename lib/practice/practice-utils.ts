/**
 * practice-utils
 *
 * Pure utility functions for the practice mode domain.
 */

import { formatPitchName, PracticeState, DetectedNote, PracticeStatus } from '@/lib/practice-core'
import { Note } from '@/lib/exercises/types'

/**
 * Derived state used by UI components to represent the current progress
 * and targets of a practice session.
 */
export interface DerivedPracticeState {
  status: PracticeStatus
  currentNoteIndex: number
  targetNote: Note | undefined
  totalNotes: number
  progress: number
  lastDetectedNote: DetectedNote | undefined
  targetPitchName: string | undefined
}

/**
 * Derives calculated UI state from the raw practice domain state.
 *
 * @param practiceState - The current state from the practice engine.
 * @returns A simplified representation for UI consumption.
 */
export function derivePracticeState(practiceState: PracticeState | undefined): DerivedPracticeState {
  const status = practiceState?.status ?? 'idle'
  const currentNoteIndex = practiceState?.currentIndex ?? 0
  const targetNote = practiceState?.exercise.notes[currentNoteIndex]
  const totalNotes = practiceState?.exercise.notes.length ?? 0

  const completionAdjustment = status === 'completed' ? 1 : 0
  const progress = totalNotes > 0
    ? ((currentNoteIndex + completionAdjustment) / totalNotes) * 100
    : 0

  const history = practiceState?.detectionHistory ?? []
  const lastDetectedNote = history.length > 0 ? history[0] : undefined
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : undefined

  return {
    status,
    currentNoteIndex,
    targetNote,
    totalNotes,
    progress,
    lastDetectedNote,
    targetPitchName
  }
}
