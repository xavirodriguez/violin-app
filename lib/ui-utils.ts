import { AppError, ERROR_CODES } from './errors/app-error'

/**
 * Clamps a number between min and max values.
 * Refactored for range validation and positional argument limit.
 *
 * @param params - The clamp parameters `{ value, min, max }`.
 * @returns The clamped value.
 * @throws AppError - CODE: DATA_VALIDATION_ERROR if `min > max`.
 *
 * @example
 * ```ts
 * clamp({ value: 5, min: 0, max: 10 });   // 5
 * clamp({ value: -5, min: 0, max: 10 });  // 0
 * clamp({ value: 15, min: 0, max: 10 });  // 10
 * ```
 */
export function clamp(params: { value: number; min: number; max: number }): number {
  const { value, min, max } = params
  validateClampRange(min, max)

  const result = Math.min(Math.max(value, min), max)
  return result
}

function validateClampRange(min: number, max: number): void {
  const isInvalid = min > max
  if (isInvalid) {
    throw new AppError({
      message: `Invalid range: min (${min}) cannot be greater than max (${max})`,
      code: ERROR_CODES.DATA_VALIDATION_ERROR,
    })
  }
}
