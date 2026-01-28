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
export type CanonicalAccidental = -1 | 0 | 1

/**
 * Normalizes various accidental formats into a CanonicalAccidental.
 *
 * @param input - The raw accidental value (number, string, or null).
 * @returns A CanonicalAccidental (-1, 0, or 1).
 */
export function normalizeAccidental(input: unknown): CanonicalAccidental {
  if (input === 1 || input === 'sharp' || input === '#') {
    return 1
  }
  if (input === -1 || input === 'flat' || input === 'b') {
    return -1
  }
  if (input === 2 || input === 'double-sharp' || input === '##') {
    return 1
  }
  if (input === -2 || input === 'double-flat' || input === 'bb') {
    return -1
  }
  if (input === 0 || input === 'natural' || input === '' || input === null || input === undefined) {
    return 0
  }

  // If we reach here, the input is something unexpected.
  throw new Error(`Unsupported alter value: ${input}`)
}
