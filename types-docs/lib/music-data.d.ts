/**
 * LegacyMusicData
 * Contains legacy exercise definitions and interfaces.
 *
 * @deprecated This module is maintained for backward compatibility.
 * Use the new exercise system in `lib/exercises/` for new features.
 */
import type { Exercise } from './exercises/types';
/**
 * Represents a single musical note in the legacy system.
 * @internal
 */
interface LegacyNote {
    /** Note name with octave (e.g., "G4"). */
    pitch: string;
    /** Rhythmic duration (e.g., "quarter"). */
    duration: string;
    /** The measure number where this note resides. */
    measure: number;
}
/**
 * Interface for the legacy Exercise object.
 *
 * @deprecated Use Exercise from '@/lib/exercises/types' instead.
 * This type will be removed in v2.0.
 */
export interface LegacyExercise {
    /** Unique identifier. */
    id: string;
    /** Human-readable name. */
    name: string;
    /** List of notes in the exercise. */
    notes: LegacyNote[];
    /** Pre-generated MusicXML string. */
    musicXML: string;
}
/**
 * Example legacy exercise for G Major Scale.
 */
export declare const G_MAJOR_SCALE_EXERCISE: LegacyExercise;
/**
 * Adapts a legacy exercise into the modern Exercise format.
 */
export declare function adaptLegacyExercise(legacy: LegacyExercise): Exercise;
export {};
