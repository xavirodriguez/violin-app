/**
 * ExerciseTypes
 * Shared type definitions for violin exercises, covering musical properties,
 * score metadata, and exercise data structures.
 */

import type { CanonicalAccidental } from '@/lib/domain/musical-domain'

/** Represents the base name of a musical pitch. */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/**
 * Represents a specific note on the musical staff.
 */
export interface Pitch {
  /** The letter name of the pitch. */
  step: PitchName
  /** The octave number (e.g., 4 for Middle C). */
  octave: number
  /**
   * The accidental for the pitch in canonical format.
   * @remarks -1 for flat, 0 for natural, 1 for sharp.
   */
  alter: CanonicalAccidental
}

/**
 * Represents the rhythmic duration of a note in standard musical notation.
 * 1 = Whole, 2 = Half, 4 = Quarter, 8 = Eighth, 16 = 16th, 32 = 32nd.
 */
export type NoteDuration = 1 | 2 | 4 | 8 | 16 | 32

/**
 * Represents a single musical note with its pitch and rhythmic duration.
 */
export interface Note {
  /** The pitch of the note. */
  pitch: Pitch
  /** The duration of the note. */
  duration: NoteDuration
}

// --- Metadata types ---

/** Categories for grouping exercises. */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs'

/** Difficulty levels for pedagogical progression. */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

/**
 * Defines the attributes of a musical score.
 * Used for generating MusicXML headers.
 */
export interface ScoreMetadata {
  /** The clef used for the staff. Violin usually uses 'G'. */
  clef: 'G' | 'F' | 'C'
  /** The time signature of the piece. */
  timeSignature: {
    /** Number of beats per measure. */
    beats: number
    /** The note value that represents one beat. */
    beatType: number
  }
  /**
   * The key signature represented as the number of sharps (positive) or flats (negative).
   * Example: 2 for D Major, -1 for F Major, 0 for C Major.
   */
  keySignature: number
}

/**
 * Interface for raw exercise data definitions.
 * This structure is used to define exercises in the category files.
 */
export interface ExerciseData {
  /** Unique identifier for the exercise. */
  id: string
  /** Human-readable name of the exercise. */
  name: string
  /** Brief description of the exercise's goal. */
  description: string
  /** The pedagogical category. */
  category: ExerciseCategory
  /** The intended difficulty level. */
  difficulty: Difficulty
  /** Metadata required for score rendering. */
  scoreMetadata: ScoreMetadata
  /** Ordered array of notes in the exercise. */
  notes: Note[]
}

/**
 * The processed exercise object consumed by the application.
 * Extends `ExerciseData` with the generated MusicXML string.
 */
export interface Exercise extends ExerciseData {
  /** The complete MusicXML representation of the exercise. */
  musicXML: string
}
