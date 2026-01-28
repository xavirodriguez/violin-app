/**
 * MusicXMLBuilder
 * Provides logic for generating MusicXML 3.1 strings from structured exercise data.
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
 */
const renderPitch = (pitch: Pitch): string => {
  const { step, octave, alter } = pitch
  const alterTag = alter !== 0 ? `<alter>${alter}</alter>` : ''
  return `<pitch><step>${step}</step>${alterTag}<octave>${octave}</octave></pitch>`
}

/**
 * Renders a `Note` object into its MusicXML `<note>` tag representation.
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
 * Simple validation for MusicXML well-formedness.
 */
function validateMusicXML(xml: string): void {
  const requiredTags = ['<score-partwise', '<part-list', '<measure', '<note']
  for (const tag of requiredTags) {
    if (!xml.includes(tag)) {
      throw new Error(`Generated MusicXML is missing required tag: ${tag}`)
    }
  }
}

/**
 * Generates a complete MusicXML string from an ExerciseData object.
 */
export const generateMusicXML = (exercise: ExerciseData): string => {
  const { scoreMetadata, notes } = exercise
  const { keySignature, timeSignature, clef } = scoreMetadata

  const notesXML = notes.map(renderNote).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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

  validateMusicXML(xml)
  return xml
}
