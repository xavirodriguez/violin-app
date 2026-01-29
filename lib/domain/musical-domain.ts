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
  const mapping: Record<string, CanonicalAccidental> = {
    '1': 1,
    sharp: 1,
    '#': 1,
    '2': 1,
    'double-sharp': 1,
    '##': 1,
    '-1': -1,
    flat: -1,
    b: -1,
    '-2': -1,
    'double-flat': -1,
    bb: -1,
    '0': 0,
    natural: 0,
    '': 0,
  }

  if (input === null || input === undefined) {
    return 0
  }

  const key = String(input)
  if (key in mapping) {
    return mapping[key]
  }

  throw new Error(`Unsupported alter value: ${input}`)
}
