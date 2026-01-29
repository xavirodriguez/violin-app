/**
 * Types and interfaces for advanced violin technique analysis.
 */

export interface TechniqueFrame {
  timestamp: number
  pitchHz: number
  cents: number
  rms: number
  confidence: number
  noteName: string
}

export interface VibratoMetrics {
  present: boolean
  /** Vibrato rate in Hz (typical range: 4-8 Hz) */
  rateHz: number
  /** Vibrato width in cents (typical range: 10-50 cents) */
  widthCents: number
  /**
   * Vibrato regularity score.
   *
   * @remarks
   * Range: 0.0 to 1.0.
   * - 0.0: Completely irregular/random oscillation
   * - 0.5: Moderately regular
   * - 1.0: Perfect sinusoidal regularity
   */
  regularity: number
}

export interface PitchStability {
  settlingStdCents: number
  globalStdCents: number
  driftCentsPerSec: number
  inTuneRatio: number // 0..1
}

export interface AttackReleaseMetrics {
  attackTimeMs: number
  pitchScoopCents: number
  releaseStability: number // std of last N ms
}

export interface ResonanceMetrics {
  suspectedWolf: boolean
  rmsBeatingScore: number
  pitchChaosScore: number
  lowConfRatio: number
}

export interface TransitionMetrics {
  transitionTimeMs: number
  glissAmountCents: number
  landingErrorCents: number
  correctionCount: number
}

export interface RhythmMetrics {
  onsetErrorMs: number
  durationErrorMs?: number
}

export interface NoteTechnique {
  vibrato: VibratoMetrics
  pitchStability: PitchStability
  attackRelease: AttackReleaseMetrics
  resonance: ResonanceMetrics
  rhythm: RhythmMetrics
  transition: TransitionMetrics
}

export interface NoteSegment {
  noteIndex: number
  targetPitch: string
  startTime: number
  endTime: number
  expectedStartTime?: number
  expectedDuration?: number
  frames: TechniqueFrame[]
}

export interface Observation {
  type: 'intonation' | 'vibrato' | 'rhythm' | 'attack' | 'stability' | 'resonance' | 'transition'

  /**
   * Severity level of the technical issue.
   *
   * @remarks
   * - 1: Minor issue (cosmetic, does not affect musicality)
   * - 2: Moderate issue (noticeable, affects quality)
   * - 3: Critical issue (fundamental flaw, requires immediate attention)
   */
  severity: 1 | 2 | 3

  /**
   * Confidence in this observation.
   *
   * @remarks
   * Range: 0.0 to 1.0.
   * - \< 0.5: Low confidence (speculative, may be noise)
   * - 0.5-0.8: Moderate confidence (likely accurate)
   * - \> 0.8: High confidence (very reliable)
   */
  confidence: number

  /** User-facing description of the issue */
  message: string

  /** Actionable pedagogical advice */
  tip: string

  /** Optional raw data supporting this observation (for debugging) */
  evidence?: unknown
}
