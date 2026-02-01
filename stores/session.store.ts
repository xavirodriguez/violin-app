import { create } from 'zustand'
import { NoteTechnique } from '../lib/technique-types'

export interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  timeToCompleteMs?: number
  averageCents: number
  wasInTune: boolean
  technique?: NoteTechnique
}

export interface PracticeSession {
  id: string
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  exerciseId: string
  exerciseName: string
  mode: 'tuner' | 'practice'
  noteResults: NoteResult[]
  notesAttempted: number
  notesCompleted: number
  accuracy: number
  averageCents: number
}

interface SessionState {
  current: PracticeSession | null
  isActive: boolean
  perfectNoteStreak: number
}

interface SessionActions {
  start: (exerciseId: string, exerciseName: string, mode?: 'tuner' | 'practice') => void
  end: () => PracticeSession | null
  recordAttempt: (noteIndex: number, pitch: string, cents: number, inTune: boolean) => void
  recordCompletion: (noteIndex: number, timeMs: number, technique?: NoteTechnique) => void
}

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
    let nextNoteResults = [...current.noteResults]

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
