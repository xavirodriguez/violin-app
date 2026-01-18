/**
 * Generates a MusicXML string from an ExerciseData object.
 */
import type { ExerciseData, Note, Pitch } from './types'

const DURATION_TO_VALUE: Record<string, number> = {
  quarter: 1,
  half: 2,
  whole: 4,
}

const renderPitch = (pitch: Pitch): string => {
  const { step, octave, alter } = pitch
  const alterTag = alter ? `<alter>${alter === '#' ? 1 : -1}</alter>` : ''
  return `<pitch><step>${step}</step>${alterTag}<octave>${octave}</octave></pitch>`
}

const renderNote = (note: Note): string => {
  const durationValue = DURATION_TO_VALUE[note.duration] || 1
  return `
    <note>
      ${renderPitch(note.pitch)}
      <duration>${durationValue}</duration>
      <type>${note.duration}</type>
    </note>`
}

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
