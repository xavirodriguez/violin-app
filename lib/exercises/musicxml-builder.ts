/**
 * MusicXMLBuilder
 * Provides logic for generating MusicXML 3.1 strings from structured exercise data.
 * This allows dynamic creation of sheet music for OpenSheetMusicDisplay to render.
 */

import type { ExerciseData, Note, Pitch } from './types'

/**
 * Mapping of rhythmic durations to MusicXML division values.
 * @internal
 */
const DURATION_TO_VALUE: Record<string, number> = {
  quarter: 1,
  half: 2,
  whole: 4,
}

/**
 * Renders a `Pitch` object into its MusicXML `<pitch>` tag representation.
 *
 * @param pitch - The pitch object to render.
 * @returns A string containing the `<pitch>` XML block.
 * @internal
 */
const renderPitch = (pitch: Pitch): string => {
  const { step, octave, alter } = pitch
  const alterTag = alter ? `<alter>${alter === '#' ? 1 : -1}</alter>` : ''
  return `<pitch><step>${step}</step>${alterTag}<octave>${octave}</octave></pitch>`
}

/**
 * Renders a `Note` object into its MusicXML `<note>` tag representation.
 *
 * @param note - The note object to render.
 * @returns A string containing the `<note>` XML block.
 * @internal
 */
const renderNote = (note: Note): string => {
  const durationValue = DURATION_TO_VALUE[note.duration] || 1
  return `
    <note>
      ${renderPitch(note.pitch)}
      <duration>${durationValue}</duration>
      <type>${note.duration}</type>
    </note>`
}

/**
 * Generates a complete MusicXML string from an ExerciseData object.
 *
 * @param exercise - The raw data for the exercise.
 * @returns A valid MusicXML 3.1 score string.
 *
 * @remarks
 * Current implementation limitations:
 * - Assumes a single part named "Violin".
 * - Consolidates all notes into a single measure (Measure 1).
 * - Fixed division value of 1.
 *
 * @example
 * ```ts
 * const xml = generateMusicXML(myExerciseData);
 * ```
 */
export const generateMusicXML = (exercise: ExerciseData): string => {
  const { scoreMetadata, notes } = exercise
  const { keySignature, timeSignature, clef } = scoreMetadata

  const notesXML = notes.map(renderNote).join('')

  // For now, we assume a single measure. A more advanced builder could handle measure grouping.
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>${keySignature}</fifths></key>
        <time><beats>${timeSignature.beats}</beats><beat-type>${timeSignature.beatType}</beat-type></time>
        <clef><sign>${clef}</sign><line>2</line></clef>
      </attributes>
      ${notesXML}
    </measure>
  </part>
</score-partwise>`
}
