/**
 * Type Guards
 *
 * Provides type-safe narrowing functions for domain types.
 * These are used to validate data at runtime, especially when receiving
 * data from external sources or persistence.
 */
import type { Note, Exercise, Pitch } from './musical-types';
/**
 * Validates if an unknown value is a Pitch object.
 *
 * @param x - The value to check.
 * @returns True if x is a Pitch.
 */
export declare function isPitch(x: unknown): x is Pitch;
/**
 * Validates if an unknown value is a Note object.
 *
 * @param x - The value to check.
 * @returns True if x is a Note.
 */
export declare function isNote(x: unknown): x is Note;
/**
 * Validates if an unknown value is an Exercise object.
 *
 * @param x - The value to check.
 * @returns True if x is an Exercise.
 */
export declare function isExercise(x: unknown): x is Exercise;
