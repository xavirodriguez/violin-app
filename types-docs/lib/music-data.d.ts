/**
 * LegacyMusicData
 * Contains legacy exercise definitions and interfaces.
 *
 * @deprecated This module is maintained for backward compatibility.
 * Use the new exercise system in `lib/exercises/` for new features.
 */
/**
 * Represents a single musical note in the legacy system.
 * @internal
 */
interface Note {
    /** Note name with octave (e.g., "G4"). */
    pitch: string;
    /** Rhythmic duration (e.g., "quarter"). */
    duration: string;
    /** The measure number where this note resides. */
    measure: number;
}
/**
 * Interface for the legacy Exercise object.
 */
export interface Exercise {
    /** Unique identifier. */
    id: string;
    /** Human-readable name. */
    name: string;
    /** List of notes in the exercise. */
    notes: Note[];
    /** Pre-generated MusicXML string. */
    musicXML: string;
}
/**
 * Example legacy exercise for G Major Scale.
 */
export declare const G_MAJOR_SCALE_EXERCISE: Exercise;
export {};
