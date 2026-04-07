/**
 * LegacyMusicData
 * Contains legacy exercise definitions and interfaces.
 *
 * @deprecated This module is maintained for backward compatibility.
 * Use the new exercise system in `lib/exercises/` for new features.
 */

import type { Exercise, NoteDuration } from './exercises/types'
import { parsePitch } from './exercises/utils'

/**
 * Represents a single musical note in the legacy system.
 * @internal
 */
interface LegacyNote {
  /** Note name with octave (e.g., "G4"). */
  pitch: string
  /** Rhythmic duration (e.g., "quarter"). */
  duration: string
  /** The measure number where this note resides. */
  measure: number
}

/**
 * Interface for the legacy Exercise object.
 *
 * @deprecated Use Exercise from `\@/lib/exercises/types` instead.
 * This type will be removed in v2.0.
 */
export interface LegacyExercise {
  /** Unique identifier. */
  id: string
  /** Human-readable name. */
  name: string
  /** List of notes in the exercise. */
  notes: LegacyNote[]
  /** Pre-generated MusicXML string. */
  musicXML: string
}

/**
 * Example legacy exercise for G Major Scale.
 */
export const G_MAJOR_SCALE_EXERCISE: LegacyExercise = {
  id: 'g-major-scale',
  name: 'G Major Scale',
  notes: [
    { pitch: 'G4', duration: 'quarter', measure: 1 },
    { pitch: 'A4', duration: 'quarter', measure: 1 },
    { pitch: 'B4', duration: 'quarter', measure: 1 },
    { pitch: 'C5', duration: 'quarter', measure: 1 },
    { pitch: 'D5', duration: 'quarter', measure: 2 },
    { pitch: 'E5', duration: 'quarter', measure: 2 },
    { pitch: 'F#5', duration: 'quarter', measure: 2 },
    { pitch: 'G5', duration: 'quarter', measure: 2 },
  ],
  musicXML: `<?xml version="1.0" encoding="UTF-8"?>
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
        <key><fifths>1</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>F</step><alter>1</alter><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`,
}

/**
 * Adapts a legacy exercise into the modern Exercise format.
 */
export function adaptLegacyExercise(legacy: LegacyExercise): Exercise {
  const metadata = assembleModernMetadata()
  const modernNotes = mapModernNotes(legacy.notes)
  const result = assembleModernExercise({ legacy, metadata, notes: modernNotes })

  return result
}

function assembleModernMetadata() {
  const clef = 'G' as const
  const beats = 4
  const beatType = 4
  const keySignature = 0

  return {
    clef,
    timeSignature: { beats, beatType },
    keySignature,
  }
}

function mapModernNotes(legacyNotes: LegacyNote[]) {
  const modernNotes = legacyNotes.map((n) => ({
    pitch: parsePitch(n.pitch),
    duration: mapLegacyDuration(n.duration),
  }))

  return modernNotes
}

function assembleModernExercise(params: {
  legacy: LegacyExercise
  metadata: any
  notes: any
}): Exercise {
  const { legacy, metadata, notes } = params
  return {
    id: legacy.id,
    name: legacy.name,
    description: 'Legacy exercise',
    category: 'Scales',
    difficulty: 'Beginner',
    scoreMetadata: metadata,
    technicalGoals: [],
    estimatedDuration: '1 min',
    technicalTechnique: 'General',
    notes: notes,
    musicXML: legacy.musicXML,
  }
}

function mapLegacyDuration(legacyDuration: string): NoteDuration {
  const durationMap: Record<string, NoteDuration> = {
    whole: 1,
    half: 2,
    quarter: 4,
    eighth: 8,
    sixteenth: 16,
    'thirty-second': 32,
  }

  const result = durationMap[legacyDuration]
  const finalDuration = result ?? 4

  return finalDuration
}
