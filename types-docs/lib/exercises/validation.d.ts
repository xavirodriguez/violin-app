import { Exercise } from './types';
/**
 * Validates an exercise for semantic correctness.
 * Throws AppError if validation fails.
 *
 * @param exercise - The exercise to validate.
 * @returns The validated exercise cast to Exercise type.
 */
export declare function validateExercise(exercise: unknown): Exercise;
