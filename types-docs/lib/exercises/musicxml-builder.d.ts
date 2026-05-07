/**
 * MusicXMLBuilder
 *
 * Provides logic for generating MusicXML 3.1 strings from structured exercise data.
 *
 * @remarks
 * This builder manually assembles the XML tags required to render a single-measure
 * violin score. It maps internal domain objects (`Note`, `Pitch`) to their
 * corresponding MusicXML representations (`<note>`, `<pitch>`, `<step>`, etc.).
 *
 * **Constraint**: Currently only supports single-measure exercises with a fixed set
 * of rhythmic divisions.
 */
import type { ExerciseData } from './types';
/**
 * Generates a complete MusicXML string from an ExerciseData object.
 */
export declare const generateMusicXML: (exercise: ExerciseData) => string;
