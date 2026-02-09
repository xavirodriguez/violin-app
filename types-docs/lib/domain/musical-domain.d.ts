/**
 * Musical Domain
 *
 * Defines the canonical types and normalization logic for musical concepts
 * shared across the application. This module serves as the source of truth for
 * scientific pitch notation and accidental mapping.
 */
/**
 * Represents a pitch alteration in a canonical numeric format.
 *
 * @remarks
 * Values:
 * - `-1`: Flat (b)
 * - `0`: Natural
 * - `1`: Sharp (#)
 *
 * @public
 */
export type CanonicalAccidental = -1 | 0 | 1;
/**
 * Normalizes various accidental representations to canonical format.
 *
 * @param input - Accidental in any supported format:
 *   - Number: -1 (flat), 0 (natural), 1 (sharp)
 *   - String: "b"/"flat" (-1), "natural"/"" (0), "#"/"sharp" (1)
 *   - null/undefined: Treated as 0 (natural)
 *
 * @returns A CanonicalAccidental (-1, 0, or 1)
 * @throws {AppError} CODE: DATA_VALIDATION_ERROR if input is invalid
 *
 * @example
 * normalizeAccidental(1);        // 1
 * normalizeAccidental("#");      // 1
 * normalizeAccidental("flat");   // -1
 * normalizeAccidental("X");      // ❌ Throws AppError
 *
 * @public
 */
export declare function normalizeAccidental(input: number | string | null | undefined): CanonicalAccidental;
