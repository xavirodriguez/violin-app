/**
 * Types and interfaces for advanced violin technique analysis.
 */

/** Nominal type for a timestamp in milliseconds. */
export type TimestampMs = number & { readonly __unit: 'ms' }
/** Nominal type for frequency in Hertz. */
export type Hz = number & { readonly __unit: 'Hz' }
/** Nominal type for pitch deviation in cents. */
export type Cents = number & { readonly __unit: 'cents' }
/** Nominal type for a ratio between 0 and 1. */
export type Ratio01 = number & { readonly __unit: '01' }

/**
 * Valid musical note name in scientific pitch notation.
 * @example "A4", "C#5", "Bb3"
 */
export type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type Accidental = '' | '#' | 'b' | '##' | 'bb'
export type Octave = number // Simplified to number, but typically 0-8
export type MusicalNoteName = `${NoteLetter}${Accidental}${number}`

/**
 * A single frame of analysis from the audio pipeline.
 * Use a discriminated union to distinguish between frames with valid pitch and without.
 */
export type TechniqueFrame = PitchedFrame | UnpitchedFrame

interface BaseFrame {
  /** The timestamp of the frame. */
  readonly timestamp: TimestampMs
  /** The Root Mean Square (volume) of the frame. */
  readonly rms: number
  /** The confidence of the pitch detection algorithm (0-1). */
  readonly confidence: number
}

export interface PitchedFrame extends BaseFrame {
  readonly kind: 'pitched'
  /** The detected fundamental frequency. */
  readonly pitchHz: Hz
  /** The pitch deviation in cents from the nearest note. */
  readonly cents: Cents
  /** The name of the detected note. */
  readonly noteName: MusicalNoteName
}

export interface UnpitchedFrame extends BaseFrame {
  readonly kind: 'unpitched'
}

/**
 * Metrics related to the quality and characteristics of vibrato.
 */
export interface VibratoMetrics {
  /** `true` if vibrato is detected in the note segment. */
  readonly present: boolean
  /** Vibrato rate in Hz (typical range: 4-8 Hz) */
  readonly rateHz?: Hz
  /** Vibrato width in cents (typical range: 10-50 cents) */
  readonly widthCents?: Cents
  /**
   * Vibrato regularity score.
   * Range: 0.0 to 1.0.
   */
  readonly regularity?: Ratio01
}

/**
 * Metrics related to pitch stability and intonation control.
 */
export interface PitchStability {
  /** The standard deviation of pitch (in cents) after the initial note attack. */
  readonly settlingStdCents: Cents
  /** The overall standard deviation of pitch (in cents) for the entire note. */
  readonly globalStdCents: Cents
  /** The rate of pitch change over time (cents per second). */
  readonly driftCentsPerSec: number
  /** The proportion of frames (0-1) within target intonation tolerance. */
  readonly inTuneRatio: Ratio01
}

/**
 * Metrics related to the beginning (attack) and end (release) of a note.
 */
export interface AttackReleaseMetrics {
  /** Time from onset to stable volume. */
  readonly attackTimeMs: TimestampMs
  /** Pitch difference between start and stable pitch ("scoop"). */
  readonly pitchScoopCents: Cents
  /** Standard deviation of pitch in the final milliseconds. */
  readonly releaseStability: Cents
}

/**
 * Metrics related to the tonal quality and resonance of the note.
 */
export interface ResonanceMetrics {
  readonly suspectedWolf: boolean
  /** Score indicating volume fluctuations (beating). */
  readonly rmsBeatingScore: Ratio01
  /** Score indicating chaotic pitch fluctuations. */
  readonly pitchChaosScore: number
  /** Proportion of high-volume frames with low confidence. */
  readonly lowConfRatio: Ratio01
}

/**
 * Metrics related to the transition between two notes.
 */
export interface TransitionMetrics {
  /** Duration of silence or glissando between notes. */
  readonly transitionTimeMs: TimestampMs
  /** Total pitch change during an audible slide. */
  readonly glissAmountCents: Cents
  /** Average pitch error at the beginning of the new note. */
  readonly landingErrorCents: Cents
  /** Number of times pitch crosses the center line at the start. */
  readonly correctionCount: number
}

/**
 * Configuration options for the technique analysis agent.
 */
export interface AnalysisOptions {
  /** Time to wait for pitch to settle (ms). Default: 150. */
  settlingTimeMs?: TimestampMs
  /** Max pitch deviation for "in tune" (cents). Default: 25. */
  inTuneThresholdCents?: Cents
  /** Min vibrato rate (Hz). Default: 4. */
  vibratoMinRateHz?: Hz
  /** Max vibrato rate (Hz). Default: 8. */
  vibratoMaxRateHz?: Hz
  /** Min vibrato width (cents). Default: 10. */
  vibratoMinWidthCents?: Cents
  /** Min regularity score for intentional vibrato. Default: 0.5. */
  vibratoMinRegularity?: Ratio01
}

/**
 * Metrics related to rhythmic accuracy.
 */
export interface RhythmMetrics {
  /** Timing error of the note's start (ms). */
  readonly onsetErrorMs: number
  /** Error of the note's total duration (ms). */
  readonly durationErrorMs?: number
}

/**
 * A comprehensive collection of all technique metrics.
 */
export interface NoteTechnique {
  readonly vibrato: VibratoMetrics
  readonly pitchStability: PitchStability
  readonly attackRelease: AttackReleaseMetrics
  readonly resonance: ResonanceMetrics
  readonly rhythm: RhythmMetrics
  readonly transition: TransitionMetrics
}

/**
 * Represents a completed musical note segment.
 */
export interface NoteSegment {
  /** Unique identifier for the segment. */
  readonly segmentId: string
  /** The zero-based index of the note within the exercise. */
  readonly noteIndex: number
  /** The target pitch for the note. */
  readonly targetPitch: MusicalNoteName
  /** The timestamp of the note's start (onset). */
  readonly startTime: TimestampMs
  /** The timestamp of the note's end (offset). */
  readonly endTime: TimestampMs
  /** Duration calculated from end - start. */
  readonly durationMs: TimestampMs
  /** The expected start time for rhythm analysis. */
  readonly expectedStartTime?: TimestampMs
  /** The expected duration for rhythm analysis. */
  readonly expectedDuration?: TimestampMs
  /** Readonly array of frames that comprise the note. */
  readonly frames: ReadonlyArray<TechniqueFrame>
}

/**
 * Represents a piece of pedagogical feedback.
 */
export interface Observation {
  readonly type: 'intonation' | 'vibrato' | 'rhythm' | 'attack' | 'stability' | 'resonance' | 'transition'
  readonly severity: 1 | 2 | 3
  readonly confidence: Ratio01
  readonly message: string
  readonly tip: string
  /** Structured evidence supporting this observation. */
  readonly evidence?: Record<string, unknown>
}
