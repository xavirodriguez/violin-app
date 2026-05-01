import { NoteTechnique } from '../technique-types'

/**
 * Summary of technical performance for a note, focused on MVP priorities.
 */
export interface NoteTechniqueSummary {
  pitchStability: {
    settlingStdCents: number
    globalStdCents: number
  }
  resonance: {
    rmsBeatingScore: number
  }
  attackRelease?: {
    attackTimeMs: number
  }
  rhythm?: {
    onsetErrorMs: number
  }
}

/**
 * Result of practicing a single note.
 * Can represent a note in progress or a completed one.
 */
export interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  /** Optional because it's only available once the note is completed. */
  timeToCompleteMs?: number
  averageCents: number
  wasInTune: boolean
  /** Full technique data if available, or summary for persistence. */
  technique?: NoteTechnique | NoteTechniqueSummary
}

/**
 * Represents a practice session that is currently active.
 * Does not have endTimeMs or durationMs.
 */
export interface LivePracticeSession {
  id: string
  startTimeMs: number
  exerciseId: string
  exerciseName: string
  mode: 'tuner' | 'practice'
  noteResults: NoteResult[]
  notesAttempted: number
  notesCompleted: number
  accuracy: number
  averageCents: number
}

/**
 * Represents a practice session that has been finished.
 */
export interface CompletedPracticeSession extends LivePracticeSession {
  endTimeMs: number
  durationMs: number
}

/**
 * Represents the format of a session stored in persistence (analytics/history).
 * Encourages using NoteTechniqueSummary to save space.
 */
export interface PersistedPracticeSession extends Omit<CompletedPracticeSession, 'noteResults'> {
  noteResults: Array<Omit<NoteResult, 'technique'> & { technique?: NoteTechniqueSummary }>
}

/**
 * Canonical type for a completed session.
 * Replaces the old PracticeResult/PracticeSession.
 */
export type PracticeSession = CompletedPracticeSession

/**
 * Maps a full NoteTechnique to a minimal summary for persistence.
 */
export function summarizeTechnique(technique: NoteTechnique): NoteTechniqueSummary {
  return {
    pitchStability: {
      settlingStdCents: technique.pitchStability.settlingStdCents,
      globalStdCents: technique.pitchStability.globalStdCents,
    },
    resonance: {
      rmsBeatingScore: technique.resonance.rmsBeatingScore,
    },
    attackRelease: {
      attackTimeMs: technique.attackRelease.attackTimeMs,
    },
    rhythm: {
      onsetErrorMs: technique.rhythm.onsetErrorMs,
    },
  }
}

/**
 * Maps a completed session to its persisted format.
 */
export function toPersistedSession(session: CompletedPracticeSession): PersistedPracticeSession {
  return {
    ...session,
    noteResults: session.noteResults.map((nr) => ({
      ...nr,
      technique: nr.technique && 'pitchStability' in nr.technique ?
        ( 'vibrato' in nr.technique ? summarizeTechnique(nr.technique) : nr.technique ) :
        undefined,
    })),
  }
}
