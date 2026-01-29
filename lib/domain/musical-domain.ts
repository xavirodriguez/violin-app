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
 * Normalizes various accidental representations to canonical format.
 *
 * @param input - Accidental in any supported format:
 *   - Number: -1 (flat), 0 (natural), 1 (sharp)
 *   - String: "b"/"flat" (-1), "natural"/"" (0), "#"/"sharp" (1)
 *   - null/undefined: Treated as 0 (natural)
 *
 * @returns A CanonicalAccidental (-1, 0, or 1)
 * @throws {Error} if input is invalid
 *
 * @example
 * normalizeAccidental(1);        // 1
 * normalizeAccidental("#");      // 1
 * normalizeAccidental("flat");   // -1
 * normalizeAccidental("X");      // ❌ Throws Error
 */
export function normalizeAccidental(
  input: number | string | null | undefined,
): CanonicalAccidental {
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
