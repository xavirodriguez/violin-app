/**
 * Musical Domain
 *
 * Defines the canonical types and normalization logic for musical concepts
 * shared across the application. This module serves as the source of truth for
 * scientific pitch notation and accidental mapping.
 *
 * @remarks
 * All musical logic in the application follows the standards defined here to
 * ensure consistency between the audio engine, the notation renderer, and
 * the persistence layer.
 */
/**
 * Represents a pitch alteration in a canonical numeric format.
 *
 * @remarks
 * This numeric representation is used for internal calculations and
 * pitch-to-frequency mapping.
 *
 * **Canonical Values**:
 * - `-1`: Flat (b)
 * - `0`: Natural
 * - `1`: Sharp (#)
 *
 * @public
 */
export type CanonicalAccidental = -1 | 0 | 1;
/**
 * Normalizes various accidental representations to the canonical numeric format.
 *
 * @remarks
 * This function handles the variability of accidental representation in
 * different formats (MusicXML, user input, internal constants).
 *
 * **Supported Formats**:
 * - **Numeric**: -1 (flat), 0 (natural), 1 (sharp).
 * - **MusicXML Labels**: "flat", "natural", "sharp", "double-flat", "double-sharp".
 * - **Notation Symbols**: "b", "#", "##", "bb".
 * - **Nullability**: `undefined` are treated as `0` (natural).
 *
 * @param input - Accidental in any supported format.
 *
 * @returns A {@link CanonicalAccidental} (-1, 0, or 1).
 *
 * @throws {@link AppError} with code `DATA_VALIDATION_ERROR` if the input
 *         cannot be mapped to a known accidental.
 *
 * @example
 * ```ts
 * normalizeAccidental(1);        // returns 1
 * normalizeAccidental("#");      // returns 1
 * normalizeAccidental("flat");   // returns -1
 * ```
 *
 * @public
 */
export declare function normalizeAccidental(input: number | string | undefined): CanonicalAccidental;
