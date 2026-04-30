import { Note } from './musical-types'

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
  /** The primary technique focus (e.g., "Legato", "Staccato", "Intonation"). */
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
