/**
 * Clamps a number between min and max values.
 *
 * @param value - The number to clamp
 * @param min - Minimum boundary
 * @param max - Maximum boundary
 * @returns The clamped value
 * @throws AppError - CODE: DATA_VALIDATION_ERROR if min \> max
 *
 * @example
 * clamp(5, 0, 10);   // 5
 * clamp(-5, 0, 10);  // 0
 * clamp(15, 0, 10);  // 10
 * clamp(5, 10, 0);   // ❌ Throws AppError
 */
export declare function clamp(value: number, min: number, max: number): number;
