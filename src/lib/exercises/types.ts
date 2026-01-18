/**
 * Shared type definitions for violin exercises.
 */

// Represents musical pitch, e.g., G, A#, Bb
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type Accidental = '#' | 'b' | null

// Represents a specific note on the staff
export interface Pitch {
  step: PitchName
  octave: number
  alter: Accidental // '#' for sharp, 'b' for flat
}

// Represents the rhythmic duration of a note
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | '16th' | '32nd'

// Represents a single musical note with pitch and duration
export interface Note {
  pitch: Pitch
  duration: NoteDuration
}

// --- Metadata types ---

export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs'
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

// Defines the attributes of the musical score
export interface ScoreMetadata {
  clef: 'G' | 'F' | 'C'
  timeSignature: {
    beats: number
    beatType: number
  }
  keySignature: number // Number of sharps or flats (e.g., 2 for D Major, -1 for F Major)
}

/**
 * Interface for the raw exercise data before it's processed.
 * This is how exercises will be defined in the category files.
 */
export interface ExerciseData {
  id: string
  name: string
  description: string
  category: ExerciseCategory
  difficulty: Difficulty
  scoreMetadata: ScoreMetadata
  notes: Note[]
}

/**
 * The final, processed exercise object that the application will consume.
 * It includes the generated MusicXML string.
 */
export interface Exercise extends ExerciseData {
  musicXML: string
}
