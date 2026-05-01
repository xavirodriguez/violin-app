import type { CanonicalAccidental } from '@/lib/domain/musical-domain'
import type { AppError } from '@/lib/errors/app-error'
import type { PitchDetector } from '@/lib/pitch-detector'

/**
 * Represents the base name of a musical pitch (the white keys on a piano).
 *
 * @public
 */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/**
 * Represents a specific pitch on the musical staff, including its octave and accidental.
 *
 * @remarks
 * Uses scientific pitch notation (SPN) for octave numbering.
 *
 * @public
 */
export interface Pitch {
  /** The letter name of the pitch (e.g., 'A', 'C'). */
  step: PitchName
  /**
   * The octave number in scientific pitch notation (e.g., 4 for Middle C).
   *
   * **Violin Standard Tuning**:
   * - G3 (G string)
   * - D4 (D string)
   * - A4 (A string)
   * - E5 (E string)
   */
  octave: number
  /**
   * The accidental for the pitch.
   *
   * @remarks
   * Expressed as a {@link CanonicalAccidental}: -1 for flat, 0 for natural, 1 for sharp.
   */
  alter: CanonicalAccidental
}

/**
 * Represents the rhythmic duration of a note relative to a whole note.
 *
 * @remarks
 * Expressed as the denominator of the division of a whole note.
 *
 * **Standard Mappings**:
 * - `1`: Whole note (4 beats in 4/4)
 * - `2`: Half note (2 beats)
 * - `4`: Quarter note (1 beat)
 * - `6`: Dotted quarter note (1.5 beats)
 * - `8`: Eighth note (0.5 beats)
 * - `16`: Sixteenth note (0.25 beats)
 * - `32`: Thirty-second note (0.125 beats)
 *
 * @public
 */
export type NoteDuration = 1 | 2 | 4 | 6 | 8 | 16 | 32

/**
 * Represents a single musical note, combining pitch, duration, and pedagogical metadata.
 *
 * @public
 */
export interface Note {
  /** The scientific pitch definition of the note. */
  pitch: Pitch
  /** The rhythmic duration value. */
  duration: NoteDuration
  /** Optional pedagogical annotations to assist the student during practice. */
  annotations?: {
    /** Suggested finger number (1-4). 0 or undefined for open strings. */
    fingerNumber?: 1 | 2 | 3 | 4
    /** Suggested bowing direction ('up' for push, 'down' for pull). */
    bowDirection?: 'up' | 'down'
    /** Whether to show a visual warning flag (e.g., for difficult shifts or accidentals). */
    warningFlag?: boolean
  }
}

/**
 * High-level categories for grouping musical exercises in the library.
 *
 * @public
 */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs'

/**
 * Difficulty levels used for pedagogical progression and recommendations.
 *
 * @public
 */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

/**
 * Metadata defining the musical properties required for score rendering.
 *
 * @remarks
 * This information is used by the MusicXML engine to create valid headers
 * and staff definitions compatible with OpenSheetMusicDisplay (OSMD).
 *
 * @public
 */
export interface ScoreMetadata {
  /** The clef used for the staff. Violin always uses 'G' (treble clef). */
  clef: 'G' | 'F' | 'C'
  /** The time signature of the piece. */
  timeSignature: {
    /** Number of beats per measure (numerator). */
    beats: number
    /** The note value that represents one beat (denominator). */
    beatType: number
  }
  /**
   * The key signature, represented as the number of sharps (positive) or flats (negative) in the circle of fifths.
   *
   * @example
   * - `2`: D Major / B Minor (F#, C#)
   * - `-1`: F Major / D Minor (Bb)
   * - `0`: C Major / A Minor
   */
  keySignature: number
}

/**
 * Raw definition of an exercise, containing structured musical data.
 *
 * @remarks
 * This interface represents the "blueprint" of an exercise before it's converted
 * to visual MusicXML for rendering.
 *
 * @public
 */
export interface ExerciseData {
  /** Unique identifier for the exercise (UUID). */
  id: string
  /** Human-readable display name. */
  name: string
  /** Detailed description of the exercise's objective and technical focus. */
  description: string
  /** The pedagogical category it belongs to (e.g., "Scales"). */
  category: ExerciseCategory
  /** The intended difficulty level for student progression. */
  difficulty: Difficulty
  /** Metadata required for rendering the musical score (clef, time signature, etc.). */
  scoreMetadata: ScoreMetadata
  /** Ordered array of notes that make up the exercise. */
  notes: Note[]
  /** List of technical skills the student will improve (e.g., "Third Position"). */
  technicalGoals: string[]
  /** Human-readable estimated time to complete (e.g., "5 mins"). */
  estimatedDuration: string
  /** El objetivo técnico principal (e.g., "Legato", "Staccato", "Intonation"). */
  technicalTechnique: string
  /** Whether this exercise is highlighted as a recommendation in the UI. */
  recommended?: boolean
  /** Optional tempo range for the exercise. */
  tempoRange?: {
    /** Minimum tempo in BPM. */
    min: number
    /** Maximum tempo in BPM. */
    max: number
  }
}

/**
 * A fully-realized exercise including its visual MusicXML representation.
 *
 * @remarks
 * This is the final object used by the `PracticeStore` and `SheetMusic` components.
 *
 * @public
 */
export interface Exercise extends ExerciseData {
  /** The complete, generated MusicXML string for the exercise. */
  musicXML: string
}

/**
 * Lifetime statistics for an individual exercise.
 *
 * @remarks
 * These metrics are used by the `ExerciseRecommender` to determine mastery
 * and suggest review cycles.
 *
 * @public
 */
export interface ExerciseStats {
  /** ID of the exercise. */
  exerciseId: string
  /** Total number of times this exercise was successfully completed. */
  timesCompleted: number
  /** Highest accuracy percentage ever recorded for this exercise. */
  bestAccuracy: number
  /** Rolling average of accuracy across all historical attempts. */
  averageAccuracy: number
  /** Fastest completion time ever recorded (ms). */
  fastestCompletionMs: number
  /** Unix timestamp of the most recent practice attempt. */
  lastPracticedMs: number
}

/**
 * Possible states for the Standalone Tuner.
 */
export type TunerState =
  | { kind: 'IDLE' }
  | { kind: 'INITIALIZING'; readonly sessionToken: number | string }
  | { kind: 'READY'; readonly sessionToken: number | string }
  | { kind: 'LISTENING'; readonly sessionToken: number | string }
  | {
      kind: 'DETECTED'
      pitch: number
      note: string
      cents: number
      confidence: number
      readonly sessionToken: number | string
    }
  | { kind: 'ERROR'; error: AppError }

/**
 * States for microphone permission handling.
 */
export type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED'

/**
 * Interface representing the tuner store's state and available actions.
 */
export interface TunerStore {
  state: TunerState
  permissionState: PermissionState
  detector: PitchDetector | undefined
  devices: MediaDeviceInfo[]
  deviceId: string | undefined
  sensitivity: number
  analyser: AnalyserNode | undefined
  initialize: () => Promise<void>
  retry: () => Promise<void>
  reset: () => Promise<void>
  updatePitch: (pitch: number, confidence: number) => void
  handleDetectedPitch: (params: { pitch: number; confidence: number; token: number | string }) => void
  startListening: () => void
  stopListening: () => void
  loadDevices: () => Promise<void>
  setDeviceId: (deviceId: string) => Promise<void>
  setSensitivity: (sensitivity: number) => void
}
