import { AppError, ERROR_CODES } from './errors/app-error'

/**
 * Clamps a number between min and max values.
 *
 * @param value - The number to clamp
 * @param min - Minimum boundary
 * @param max - Maximum boundary
 * @returns The clamped value
 * @throws {AppError} CODE: DATA_VALIDATION_ERROR if min > max
 *
 * @example
 * clamp(5, 0, 10);   // 5
 * clamp(-5, 0, 10);  // 0
 * clamp(15, 0, 10);  // 10
 * clamp(5, 10, 0);   // ❌ Throws AppError
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new AppError({
      message: `Invalid range: min (${min}) cannot be greater than max (${max})`,
      code: ERROR_CODES.DATA_VALIDATION_ERROR,
    })
  }
  return Math.min(Math.max(value, min), max)
}
