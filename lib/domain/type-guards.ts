/**
 * Type Guards
 *
 * Provides type-safe narrowing functions for domain types.
 * These are used to validate data at runtime, especially when receiving
 * data from external sources or persistence.
 */

import type { Note, Exercise, Pitch } from './musical-types'

/**
 * Validates if an unknown value is a Pitch object.
 *
 * @param x - The value to check.
 * @returns True if x is a Pitch.
 */
export function isPitch(x: unknown): x is Pitch {
  return (
    typeof x === 'object' &&
    x !== null &&
    'step' in x &&
    'octave' in x &&
    'alter' in x &&
    typeof (x as Pitch).step === 'string' &&
    typeof (x as Pitch).octave === 'number' &&
    typeof (x as Pitch).alter === 'number'
  )
}

/**
 * Validates if an unknown value is a Note object.
 *
 * @param x - The value to check.
 * @returns True if x is a Note.
 */
export function isNote(x: unknown): x is Note {
  return (
    typeof x === 'object' &&
    x !== null &&
    'pitch' in x &&
    'duration' in x &&
    isPitch((x as Note).pitch) &&
    typeof (x as Note).duration === 'number'
  )
}

/**
 * Validates if an unknown value is an Exercise object.
 *
 * @param x - The value to check.
 * @returns True if x is an Exercise.
 */
export function isExercise(x: unknown): x is Exercise {
  return (
    typeof x === 'object' &&
    x !== null &&
    'id' in x &&
    'name' in x &&
    'notes' in x &&
    'musicXML' in x &&
    Array.isArray((x as Exercise).notes) &&
    (x as Exercise).notes.every(isNote)
  )
}
