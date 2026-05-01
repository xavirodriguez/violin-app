import { Exercise, NoteDuration } from './types'
import { isExercise } from '../domain/type-guards'
import { AppError, ERROR_CODES } from '../errors/app-error'

const VALID_DURATIONS: Set<NoteDuration> = new Set([1, 2, 4, 6, 8, 16, 32])

/**
 * Validates an exercise for semantic correctness.
 * Throws AppError if validation fails.
 *
 * @param exercise - The exercise to validate.
 * @returns The validated exercise cast to Exercise type.
 */
export function validateExercise(exercise: unknown): Exercise {
  if (!isExercise(exercise)) {
    throw new AppError({
      code: ERROR_CODES.INVALID_EXERCISE,
      message: 'Input does not match basic Exercise structure',
    })
  }

  if (exercise.notes.length === 0) {
    throw new AppError({
      code: ERROR_CODES.INVALID_EXERCISE,
      message: 'Exercise must contain at least one note',
    })
  }

  exercise.notes.forEach((note, index) => {
    validateNote(note, index)
  })

  return exercise as Exercise
}

function validateNote(note: unknown, index: number): void {
  const { pitch, duration } = note as { pitch: { alter: number; octave: number }; duration: number }

  if (pitch.alter < -1 || pitch.alter > 1) {
    throw new AppError({
      code: ERROR_CODES.INVALID_EXERCISE,
      message: `Invalid accidental alter=${pitch.alter} at note index ${index}. Must be -1, 0, or 1.`,
    })
  }

  if (pitch.octave < 3 || pitch.octave > 7) {
    throw new AppError({
      code: ERROR_CODES.INVALID_EXERCISE,
      message: `Invalid octave=${pitch.octave} at note index ${index}. Supported range is 3 to 7.`,
    })
  }

  if (!VALID_DURATIONS.has(duration as NoteDuration)) {
    throw new AppError({
      code: ERROR_CODES.INVALID_EXERCISE,
      message: `Invalid duration=${duration} at note index ${index}.`,
    })
  }
}
