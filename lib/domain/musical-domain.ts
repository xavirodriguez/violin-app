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
export type CanonicalAccidental = -1 | 0 | 1

/**
 * Normalizes various accidental representations to the canonical format.
 *
 * @remarks
 * This function handles the conversion from multiple input formats (numeric, string, symbol)
 * into a strictly typed {@link CanonicalAccidental}. It is primarily used during
 * exercise definition and MusicXML parsing to ensure consistency across the pipeline.
 *
 * **Supported inputs**:
 * - **Numbers**: -1, 0, 1. (Also supports -2/2 for double accidentals, mapping them to single).
 * - **Strings**: "sharp", "#", "flat", "b", "natural", "", etc.
 * - **Null/Undefined**: Defaults to 0 (natural).
 *
 * @param input - The raw accidental representation.
 * @returns A {@link CanonicalAccidental} (-1, 0, or 1).
 *
 * @throws Error - If the input format is unrecognized or unsupported.
 *
 * @example
 * ```ts
 * normalizeAccidental("#");      // returns 1
 * normalizeAccidental("flat");   // returns -1
 * normalizeAccidental(undefined); // returns 0
 * ```
 *
 * @public
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
