import { create } from 'zustand'
import { NoteTechnique } from '../lib/technique-types'
import { NoteResult, PracticeSession } from '@/lib/domain/practice-session'

/**
 * Internal state of the session store.
 *
 * @internal
 */
interface SessionState {
  /** The current active session data, or undefined if no session is active. */
  current: PracticeSession | undefined
  /** Whether a session is currently being recorded. */
  isActive: boolean
  /** Current streak of notes played with high accuracy (`< 5` cents). */
  perfectNoteStreak: number
}

/**
 * Actions for managing practice sessions and recording real-time metrics.
 *
 * @public
 */
interface SessionActions {
  /**
   * Starts a new practice session recording.
   *
   * @remarks
   * Resets the `current` session state with initial metadata.
   *
   * @param exerciseId - Unique ID of the exercise.
   * @param exerciseName - Display name of the exercise.
   * @param mode - The session mode. Defaults to 'practice'.
   */
  start: (exerciseId: string, exerciseName: string, mode?: 'tuner' | 'practice') => void

  /**
   * Ends the current session, calculates final metrics, and returns the data.
   *
   * @remarks
   * This method calculates the final accuracy and duration before clearing the active session.
   *
   * @returns The completed {@link PracticeSession} or undefined if no session was active.
   */
  end: () => PracticeSession | undefined

  /**
   * Records a single attempt (audio frame) at a specific note.
   *
   * @remarks
   * This method updates the rolling average of cents deviation for the note using
   * the formula: `nextAvg = (currentAvg * count + newCents) / (count + 1)`.
   *
   * @param params - Parameters for the note attempt.
   */
  recordAttempt: (params: { noteIndex: number; pitch: string; cents: number; inTune: boolean }) => void

  /**
   * Records the successful completion of a note.
   *
   * @remarks
   * Updates the session progress and technical metrics.
   *
   * @param params - Parameters for the note completion.
   */
  recordCompletion: (params: { noteIndex: number; timeMs: number; technique?: NoteTechnique }) => void
}

/**
 * Zustand store for tracking real-time practice session metrics and history.
 *
 * @remarks
 * This store serves as a high-frequency accumulator for session data. It is
 * decoupled from the long-term `ProgressStore` and `AnalyticsStore` to ensure
 * that real-time updates don't trigger expensive persistence logic or
 * heavy recalculations on every audio frame.
 *
 * **Concurrency**: Updates are performed using Zustand's functional set state,
 * which is safe for high-frequency calls from the audio processing loop.
 *
 * **Metric Calculation**:
 * - Accuracy is calculated as the ratio of `notesCompleted` to `notesAttempted`.
 * - Average Cents uses a rolling mean to incorporate every detected frame.
 *
 * @public
 */
export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  current: undefined,
  isActive: false,
  perfectNoteStreak: 0,

  start: (exerciseId, exerciseName, mode = 'practice') => {
    const nowMs = Date.now()
    set({
      current: {
        id: `session_${nowMs}`,
        startTimeMs: nowMs,
        endTimeMs: nowMs,
        durationMs: 0,
        exerciseId,
        exerciseName,
        mode,
        noteResults: [],
        notesAttempted: 0,
        notesCompleted: 0,
        accuracy: 0,
        averageCents: 0,
      },
      isActive: true,
    })
  },

  end: () => {
    const { current } = get()
    if (!current) return undefined

    const nowMs = Date.now()
    const completed: PracticeSession = {
      ...current,
      endTimeMs: nowMs,
      durationMs: nowMs - current.startTimeMs,
      accuracy:
        current.notesAttempted > 0 ? (current.notesCompleted / current.notesAttempted) * 100 : 0,
    }

    set({ current: undefined, isActive: false })
    return completed
  },

  recordAttempt: (params) => {
    const { current } = get()
    if (!current) return

    const results = updateNoteAttemptResults(current.noteResults, params)
    const notesAttempted = current.notesAttempted + 1
    const inTuneCount = results.filter((r) => r.wasInTune).length
    const accuracy = (inTuneCount / results.length) * 100

    set({
      current: {
        ...current,
        notesAttempted,
        noteResults: results,
        accuracy,
      },
    })
  },

  recordCompletion: (params) => {
    const { noteIndex, timeMs, technique } = params
    const { current, perfectNoteStreak } = get()
    if (!current) return

    const noteResult = current.noteResults.find((r) => r.noteIndex === noteIndex)
    const wasPerfect = noteResult && Math.abs(noteResult.averageCents) < 5
    const nextStreak = wasPerfect ? perfectNoteStreak + 1 : 0

    const nextNoteResults = current.noteResults.map((r) =>
      r.noteIndex === noteIndex ? { ...r, timeToCompleteMs: timeMs, technique } : r,
    )

    set({
      perfectNoteStreak: nextStreak,
      current: {
        ...current,
        notesCompleted: current.notesCompleted + 1,
        noteResults: nextNoteResults,
      },
    })
  },
}))

function updateNoteAttemptResults(
  results: NoteResult[],
  params: { noteIndex: number; pitch: string; cents: number; inTune: boolean },
): NoteResult[] {
  const { noteIndex, pitch, cents, inTune } = params
  const index = results.findIndex((r) => r.noteIndex === noteIndex)
  if (index >= 0) {
    return updateExistingNoteResult({ results, index, cents, inTune })
  }
  return [...results, createNewNoteResult({ noteIndex, pitch, cents, inTune })]
}

function updateExistingNoteResult(params: {
  results: NoteResult[]
  index: number
  cents: number
  inTune: boolean
}): NoteResult[] {
  const { results, index, cents, inTune } = params
  const nextResults = [...results]
  const existing = nextResults[index]
  const nextAttempts = existing.attempts + 1
  nextResults[index] = {
    ...existing,
    attempts: nextAttempts,
    averageCents: (existing.averageCents * existing.attempts + cents) / nextAttempts,
    wasInTune: inTune || existing.wasInTune,
  }
  return nextResults
}

function createNewNoteResult(params: {
  noteIndex: number
  pitch: string
  cents: number
  inTune: boolean
}): NoteResult {
  const { noteIndex, pitch, cents, inTune } = params
  return {
    noteIndex,
    targetPitch: pitch,
    attempts: 1,
    averageCents: cents,
    wasInTune: inTune,
  }
}
