/**
 * Types and interfaces for advanced violin technique analysis.
 */

/**
 * A single frame of analysis from the audio pipeline, enriched with technique-related data.
 */
export interface TechniqueFrame {
  /** The timestamp of the frame in milliseconds. */
  timestamp: number
  /** The detected fundamental frequency in Hertz. */
  pitchHz: number
  /** The pitch deviation in cents from the nearest note. */
  cents: number
  /** The Root Mean Square (volume) of the frame. */
  rms: number
  /** The confidence of the pitch detection algorithm (0-1). */
  confidence: number
  /** The name of the detected note (e.g., "C#4"). */
  noteName: string
}

/**
 * Metrics related to the quality and characteristics of vibrato.
 */
export interface VibratoMetrics {
  /** `true` if vibrato is detected in the note segment. */
  present: boolean
  /** The speed of the vibrato in Hertz (oscillations per second). */
  rateHz: number
  /** The average pitch modulation width of the vibrato in cents. */
  widthCents: number
  /** A score from 0 to 1 indicating the consistency of the vibrato's rate and width. */
  regularity: number
}

/**
 * Metrics related to pitch stability and intonation control.
 */
export interface PitchStability {
  /** The standard deviation of pitch (in cents) after the initial note attack (settling period). */
  settlingStdCents: number
  /** The overall standard deviation of pitch (in cents) for the entire note. */
  globalStdCents: number
  /** The rate of pitch change over time, calculated via linear regression, in cents per second. */
  driftCentsPerSec: number
  /** The proportion of frames (0-1) that are within the target intonation tolerance. */
  inTuneRatio: number
}

/**
 * Metrics related to the beginning (attack) and end (release) of a note.
 */
export interface AttackReleaseMetrics {
  /** The time in milliseconds from note onset to reaching 90% of the maximum volume (RMS). */
  attackTimeMs: number
  /** The pitch difference in cents between the start of the note and its stable pitch, indicating a "scoop". */
  pitchScoopCents: number
  /** The standard deviation of pitch (in cents) in the final milliseconds of the note, indicating release control. */
  releaseStability: number
}

/**
 * Metrics related to the tonal quality and resonance of the note.
 */
export interface ResonanceMetrics {
  /** `true` if a "wolf tone" (a problematic, unstable resonance) is suspected. */
  suspectedWolf: boolean
  /** A score indicating the presence of periodic volume fluctuations (beating). */
  rmsBeatingScore: number
  /** A score indicating chaotic or unstable pitch fluctuations. */
  pitchChaosScore: number
  /** The proportion of high-volume frames that have low pitch-detection confidence. */
  lowConfRatio: number
}

/**
 * Metrics related to the transition between two notes.
 */
export interface TransitionMetrics {
  /** The duration in milliseconds of the silence or glissando between notes. */
  transitionTimeMs: number
  /** The total pitch change in cents during an audible slide (glissando). */
  glissAmountCents: number
  /** The average pitch error in cents at the very beginning of the new note. */
  landingErrorCents: number
  /** The number of times the pitch crosses the center line during the note's start, indicating instability. */
  correctionCount: number
}

/**
 * Configuration options for the technique analysis agent.
 */
export interface AnalysisOptions {
  /** The time in milliseconds to wait after note onset before measuring stable pitch. */
  settlingTimeMs: number
  /** The tolerance in cents to consider a frame "in-tune" for the ratio calculation. */
  inTuneThresholdCents: number
  /** Minimum vibrato rate in Hz. */
  vibratoMinRateHz: number
  /** Maximum vibrato rate in Hz. */
  vibratoMaxRateHz: number
  /** Minimum vibrato width in cents. */
  vibratoMinWidthCents: number
  /** Minimum vibrato regularity score (0-1). */
  vibratoMinRegularity: number
}

/**
 * Metrics related to rhythmic accuracy.
 */
export interface RhythmMetrics {
  /** The timing error in milliseconds of the note's start (onset) compared to the expected time. */
  onsetErrorMs: number
  /** The error in milliseconds of the note's total duration compared to the expected duration. */
  durationErrorMs?: number
}

/**
 * Configuration options for the technique analysis heuristics.
 */
export interface AnalysisOptions {
  /** The time in milliseconds to ignore after note onset for "stable" pitch calculations (50-500ms). */
  settlingTimeMs: number
  /** The tolerance in cents for considering a frame "in-tune" for statistics. */
  inTuneThresholdCents: number
  /** Minimum rate in Hz for valid vibrato. */
  vibratoMinRateHz: number
  /** Maximum rate in Hz for valid vibrato. */
  vibratoMaxRateHz: number
  /** Minimum peak-to-peak width in cents for valid vibrato. */
  vibratoMinWidthCents: number
  /** Minimum regularity score (0.0-1.0) for valid vibrato. */
  vibratoMinRegularity: number
}

/**
 * A comprehensive collection of all technique metrics calculated for a single note.
 */
export interface NoteTechnique {
  vibrato: VibratoMetrics
  pitchStability: PitchStability
  attackRelease: AttackReleaseMetrics
  resonance: ResonanceMetrics
  rhythm: RhythmMetrics
  transition: TransitionMetrics
}

/**
 * Represents a completed musical note, containing all its analysis frames and metadata.
 */
export interface NoteSegment {
  /** The zero-based index of the note within the exercise. */
  noteIndex: number
  /** The target pitch for the note (e.g., "A#4"). */
  targetPitch: string
  /** The timestamp of the note's start (onset) in milliseconds. */
  startTime: number
  /** The timestamp of the note's end (offset) in milliseconds. */
  endTime: number
  /** The expected start time for rhythm analysis. */
  expectedStartTime?: number
  /** The expected duration for rhythm analysis. */
  expectedDuration?: number
  /** An array of all `TechniqueFrame`s that comprise the note. */
  frames: TechniqueFrame[]
}

/**
 * Represents a piece of human-readable pedagogical feedback.
 */
export interface Observation {
  /** The category of the observation. */
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
