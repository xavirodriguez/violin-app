import { describe, it, expect } from 'vitest'
import { summarizeTechnique, toPersistedSession } from './practice-session'
import { NoteTechnique } from '../technique-types'

describe('practice-session domain', () => {
  const fullTechnique: NoteTechnique = {
    vibrato: { present: true, rateHz: 5, widthCents: 20, regularity: 0.8 },
    pitchStability: {
      settlingStdCents: 5,
      globalStdCents: 10,
      driftCentsPerSec: 2,
      inTuneRatio: 0.9,
    },
    attackRelease: { attackTimeMs: 100, pitchScoopCents: 5, releaseStability: 3 },
    resonance: {
      suspectedWolf: false,
      rmsBeatingScore: 0.1,
      pitchChaosScore: 2,
      lowConfRatio: 0.05,
    },
    rhythm: { onsetErrorMs: 10, durationErrorMs: 20 },
    transition: {
      transitionTimeMs: 50,
      glissAmountCents: 10,
      landingErrorCents: 5,
      correctionCount: 0,
    },
  }

  it('summarizeTechnique should strip non-essential fields', () => {
    const summary = summarizeTechnique(fullTechnique)
    expect(summary).toEqual({
      pitchStability: {
        settlingStdCents: 5,
        globalStdCents: 10,
        inTuneRatio: 0.9,
      },
      resonance: {
        rmsBeatingScore: 0.1,
      },
      attackRelease: {
        attackTimeMs: 100,
      },
      rhythm: {
        onsetErrorMs: 10,
      },
    })
    // @ts-expect-error - testing stripped fields
    expect(summary.vibrato).toBeUndefined()
    // @ts-expect-error - testing stripped fields
    expect(summary.transition).toBeUndefined()
  })

  it('toPersistedSession should map a completed session to a persisted one', () => {
    const session = {
      id: 'test-session',
      startTimeMs: 1000,
      endTimeMs: 2000,
      durationMs: 1000,
      exerciseId: 'ex1',
      exerciseName: 'Ex 1',
      mode: 'practice' as const,
      noteResults: [
        {
          noteIndex: 0,
          targetPitch: 'A4',
          attempts: 1,
          timeToCompleteMs: 500,
          averageCents: 0,
          wasInTune: true,
          technique: fullTechnique,
        },
      ],
      notesAttempted: 1,
      notesCompleted: 1,
      accuracy: 100,
      averageCents: 0,
    }

    const persisted = toPersistedSession(session)
    expect(persisted.noteResults[0].technique).toEqual(summarizeTechnique(fullTechnique))
    // @ts-expect-error - testing stripped fields
    expect(persisted.noteResults[0].technique.vibrato).toBeUndefined()
  })
})
