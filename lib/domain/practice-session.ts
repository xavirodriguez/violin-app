import { NoteTechnique } from '../technique-types'

/**
 * Summary of technical performance for a note, focused on MVP priorities.
 * Reducido para MVP: prioriza pitchStability, resonance, attackRelease parcial y rhythm parcial.
 * Excluye vibrato y transition para ahorrar espacio en localStorage.
 *
 * @public
 */
export interface NoteTechniqueSummary {
  pitchStability: {
    settlingStdCents: number
    globalStdCents: number
    inTuneRatio: number
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
 *
 * @public
 */
export interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  /** Optional because it's only available once the note is completed. */
  timeToCompleteMs?: number
  averageCents: number
  wasInTune: boolean
  /** Full technique data if available during session, or summary for persistence. */
  technique?: NoteTechnique | NoteTechniqueSummary
}

/**
 * Represents a practice session that is currently active.
 * Does not have endTimeMs or durationMs.
 *
 * @public
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
 *
 * @public
 */
export interface CompletedPracticeSession extends LivePracticeSession {
  endTimeMs: number
  durationMs: number
}

/**
 * Represents the format of a session stored in persistence (analytics/history).
 * Mandatory use of NoteTechniqueSummary to save space in localStorage.
 *
 * @public
 */
export interface PersistedPracticeSession extends Omit<CompletedPracticeSession, 'noteResults'> {
  noteResults: Array<Omit<NoteResult, 'technique'> & { technique?: NoteTechniqueSummary }>
}

/**
 * Canonical type for a completed session.
 * Replaces the old PracticeResult/PracticeSession.
 *
 * @public
 */
export type PracticeSession = CompletedPracticeSession

/**
 * Maps a full NoteTechnique to a minimal summary for persistence.
 * Filters out non-MVP metrics (vibrato, transition).
 *
 * @public
 */
export function summarizeTechnique(technique: NoteTechnique): NoteTechniqueSummary {
  return {
    pitchStability: {
      settlingStdCents: technique.pitchStability.settlingStdCents,
      globalStdCents: technique.pitchStability.globalStdCents,
      inTuneRatio: technique.pitchStability.inTuneRatio,
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
 * Ensures all technique data is summarized.
 *
 * @public
 */
export function toPersistedSession(session: CompletedPracticeSession): PersistedPracticeSession {
  return {
    ...session,
    noteResults: session.noteResults.map((nr) => ({
      ...nr,
      technique: mapToSummary(nr.technique),
    })),
  }
}

/**
 * Internal helper to ensure we always get a summary.
 * @internal
 */
function mapToSummary(
  technique?: NoteTechnique | NoteTechniqueSummary,
): NoteTechniqueSummary | undefined {
  if (!technique) return undefined

  // If it has 'vibrato', it's the full NoteTechnique, so summarize it.
  if ('vibrato' in technique) {
    return summarizeTechnique(technique)
  }

  // Already a summary (or partial summary)
  return technique
}
