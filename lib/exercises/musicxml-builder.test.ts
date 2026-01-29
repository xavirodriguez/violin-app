import { describe, it, expect } from 'vitest'
import { generateMusicXML } from './musicxml-builder'
import { ExerciseData } from './types'

describe('MusicXMLBuilder', () => {
  it('should generate valid MusicXML for a simple scale', () => {
    const exercise: ExerciseData = {
      id: 'test-scale',
      name: 'Test Scale',
      difficulty: 'beginner',
      category: 'scales',
      scoreMetadata: {
        keySignature: 0, // C major
        timeSignature: { beats: 4, beatType: 4 },
        clef: 'G',
      },
      notes: [
        { pitch: { step: 'C', octave: 4, alter: 0 }, duration: 4 },
        { pitch: { step: 'D', octave: 4, alter: 0 }, duration: 4 },
      ],
    }

    const xml = generateMusicXML(exercise)

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<score-partwise version="3.1">')
    expect(xml).toContain('<step>C</step>')
    expect(xml).toContain('<octave>4</octave>')
    expect(xml).toContain('<step>D</step>')
    expect(xml).toContain('<duration>1</duration>') // 4 (quarter) -> 1 division
    expect(xml).toContain('<type>quarter</type>')
  })

  it('should handle accidentals correctly in MusicXML', () => {
    const exercise: ExerciseData = {
      id: 'accidental-test',
      name: 'Accidental Test',
      difficulty: 'beginner',
      category: 'scales',
      scoreMetadata: {
        keySignature: 0,
        timeSignature: { beats: 4, beatType: 4 },
        clef: 'G',
      },
      notes: [
        { pitch: { step: 'F', octave: 4, alter: 1 }, duration: 4 }, // F#4
        { pitch: { step: 'B', octave: 4, alter: -1 }, duration: 4 }, // Bb4
      ],
    }

    const xml = generateMusicXML(exercise)

    expect(xml).toContain('<step>F</step>')
    expect(xml).toContain('<alter>1</alter>')
    expect(xml).toContain('<step>B</step>')
    expect(xml).toContain('<alter>-1</alter>')
  })
})
