import { describe, it, expect } from 'vitest'
import { mapMatchedEvent } from '../lib/practice-engine/engine'
import { AppError, ERROR_CODES } from '../lib/errors/app-error'
import { NoteTechnique } from '../lib/technique-types'

describe('mapMatchedEvent validation (TASK-01)', () => {
  const mockTechnique: NoteTechnique = {
    vibrato: { present: false },
    pitchStability: {
      settlingStdCents: 0,
      globalStdCents: 0,
      driftCentsPerSec: 0,
      inTuneRatio: 1,
    },
    attackRelease: {
      attackTimeMs: 0,
      pitchScoopCents: 0,
      releaseStability: 0,
    },
    resonance: {
      suspectedWolf: false,
      rmsBeatingScore: 0,
      pitchChaosScore: 0,
      lowConfRatio: 0,
    },
    rhythm: { onsetErrorMs: 0 },
    transition: {
      transitionTimeMs: 0,
      glissAmountCents: 0,
      landingErrorCents: 0,
      correctionCount: 0,
    },
  } as any

  it('should throw TECHNIQUE_MISSING error when technique is missing', () => {
    expect(() => mapMatchedEvent({})).toThrowError(
      expect.objectContaining({
        code: ERROR_CODES.TECHNIQUE_MISSING,
        message: 'NOTE_MATCHED event is missing technique analysis payload',
      }),
    )
  })

  it('should correctly return NOTE_MATCHED event when technique is provided', () => {
    const payload = {
      technique: mockTechnique,
      observations: [],
      isPerfect: true,
    }
    const result = mapMatchedEvent(payload)
    expect(result.type).toBe('NOTE_MATCHED')
    expect(result.payload?.technique).toBe(mockTechnique)
    expect(result.payload?.isPerfect).toBe(true)
  })

  it('should handle optional observations and isPerfect', () => {
    const payload = {
      technique: mockTechnique,
    }
    const result = mapMatchedEvent(payload)
    expect(result.type).toBe('NOTE_MATCHED')
    expect(result.payload?.technique).toBe(mockTechnique)
    expect(result.payload?.observations).toEqual([])
    expect(result.payload?.isPerfect).toBe(false)
  })
})
