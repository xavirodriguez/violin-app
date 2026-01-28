/**
 * Musical Domain
 *
 * Defines the canonical types and normalization logic for musical concepts
 * shared across the application.
 */
/**
 * Represents a pitch alteration in a canonical numeric format.
 * -1: Flat (b)
 *  0: Natural
 *  1: Sharp (#)
 */
export type CanonicalAccidental = -1 | 0 | 1;
/**
 * Normalizes various accidental formats into a CanonicalAccidental.
 *
 * @param input - The raw accidental value (number, string, or null).
 * @returns A CanonicalAccidental (-1, 0, or 1).
 */
export declare function normalizeAccidental(input: unknown): CanonicalAccidental;
