import { create } from 'zustand'
import { NoteTechnique } from '../lib/technique-types'

/**
 * Result of practicing a single note within a session.
 *
 * @public
 */
export interface NoteResult {
  /** The index of the note in the exercise. */
  noteIndex: number
  /** The target pitch name (e.g., "A4"). */
  targetPitch: string
  /** Total number of attempts/frames processed for this note. */
  attempts: number
  /** Time taken to successfully complete the note, in milliseconds. */
  timeToCompleteMs?: number
  /** Average pitch deviation in cents from the target. */
  averageCents: number
  /** Whether the note was eventually played correctly in tune. */
  wasInTune: boolean
  /** Detected technique details, if applicable. */
  technique?: NoteTechnique
}

/**
 * Data model for a completed or active practice session.
 *
 * @public
 */
export interface PracticeSession {
  /** Unique session identifier. */
  id: string
  /** Unix timestamp when the session started. */
  startTimeMs: number
  /** Unix timestamp when the session ended. */
  endTimeMs: number
  /** Total session duration in milliseconds. */
  durationMs: number
  /** Identifier of the exercise practiced. */
  exerciseId: string
  /** Human-readable name of the exercise. */
  exerciseName: string
  /** The mode in which the session was conducted. */
  mode: 'tuner' | 'practice'
  /** Individual results for each note in the exercise. */
  noteResults: NoteResult[]
  /** Total number of note attempts across the whole session. */
  notesAttempted: number
  /** Total number of notes successfully completed. */
  notesCompleted: number
  /** Percentage of notes completed vs attempted. */
  accuracy: number
  /** Overall average pitch deviation in cents. */
  averageCents: number
}

/**
 * Internal state of the session store.
 */
interface SessionState {
  /** The current active session data. */
  current: PracticeSession | null
  /** Whether a session is currently being recorded. */
  isActive: boolean
  /** Current streak of notes played with high accuracy (`< 5` cents). */
  perfectNoteStreak: number
}

/**
 * Actions for managing practice sessions.
 */
interface SessionActions {
  /**
   * Starts a new practice session.
   *
   * @param exerciseId - Unique ID of the exercise.
   * @param exerciseName - Display name of the exercise.
   * @param mode - The session mode.
   */
  start: (exerciseId: string, exerciseName: string, mode?: 'tuner' | 'practice') => void

  /**
   * Ends the current session and returns the final session data.
   *
   * @returns The completed {@link PracticeSession} or null if no session was active.
   */
  end: () => PracticeSession | null

  /**
   * Records an attempt at a specific note.
   *
   * @param noteIndex - Index of the note.
   * @param pitch - Detected pitch name.
   * @param cents - Pitch deviation in cents.
   * @param inTune - Whether the attempt was considered in-tune.
   */
  recordAttempt: (noteIndex: number, pitch: string, cents: number, inTune: boolean) => void

  /**
   * Records the successful completion of a note.
   *
   * @param noteIndex - Index of the note.
   * @param timeMs - Time taken to complete.
   * @param technique - Detected technique.
   */
  recordCompletion: (noteIndex: number, timeMs: number, technique?: NoteTechnique) => void
}

/**
 * Zustand store for tracking real-time practice session metrics and history.
 *
 * @remarks
 * This store handles the low-level accumulation of practice data, such as
 * attempts, accuracy, and streaks. It is typically updated by the `PracticeStore`
 * through the `PracticeSessionRunner`.
 *
 * @public
 */
export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  current: null,
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
        averageCents: 0
      },
      isActive: true
    })
  },

  end: () => {
    const { current } = get()
    if (!current) return null

    const nowMs = Date.now()
    const completed: PracticeSession = {
      ...current,
      endTimeMs: nowMs,
      durationMs: nowMs - current.startTimeMs,
      accuracy: current.notesAttempted > 0 ? (current.notesCompleted / current.notesAttempted) * 100 : 0
    }

    set({ current: null, isActive: false })
    return completed
  },

  recordAttempt: (noteIndex, pitch, cents, inTune) => {
    const { current } = get()
    if (!current) return

    const existingIndex = current.noteResults.findIndex(r => r.noteIndex === noteIndex)
    const nextNoteResults = [...current.noteResults]

    if (existingIndex >= 0) {
      const existing = nextNoteResults[existingIndex]
      const nextAttempts = existing.attempts + 1
      nextNoteResults[existingIndex] = {
        ...existing,
        attempts: nextAttempts,
        averageCents: (existing.averageCents * existing.attempts + cents) / nextAttempts,
        wasInTune: inTune || existing.wasInTune
      }
    } else {
      nextNoteResults.push({
        noteIndex,
        targetPitch: pitch,
        attempts: 1,
        averageCents: cents,
        wasInTune: inTune
      })
    }

    const notesAttempted = current.notesAttempted + 1
    const inTuneCount = nextNoteResults.filter(r => r.wasInTune).length
    const accuracy = (inTuneCount / nextNoteResults.length) * 100

    set({
      current: {
        ...current,
        notesAttempted,
        noteResults: nextNoteResults,
        accuracy
      }
    })
  },

  recordCompletion: (noteIndex, timeMs, technique) => {
    const { current, perfectNoteStreak } = get()
    if (!current) return

    const noteResult = current.noteResults.find(r => r.noteIndex === noteIndex)
    const wasPerfect = noteResult && Math.abs(noteResult.averageCents) < 5
    const nextStreak = wasPerfect ? perfectNoteStreak + 1 : 0

    const nextNoteResults = current.noteResults.map(r =>
      r.noteIndex === noteIndex ? { ...r, timeToCompleteMs: timeMs, technique } : r
    )

    set({
      perfectNoteStreak: nextStreak,
      current: {
        ...current,
        notesCompleted: current.notesCompleted + 1,
        noteResults: nextNoteResults
      }
    })
  }
}))
