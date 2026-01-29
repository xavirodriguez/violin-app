import { describe, it, expect } from 'vitest'
import { adaptLegacyExercise, G_MAJOR_SCALE_EXERCISE } from '@/lib/music-data'

describe('Exercise Compatibility', () => {
  it('should adapt legacy exercise to modern format', () => {
    const modern = adaptLegacyExercise(G_MAJOR_SCALE_EXERCISE)

    expect(modern.id).toBe(G_MAJOR_SCALE_EXERCISE.id)
    expect(modern.name).toBe(G_MAJOR_SCALE_EXERCISE.name)
    expect(modern.notes).toHaveLength(G_MAJOR_SCALE_EXERCISE.notes.length)

    // Verify specific note adaptation
    expect(modern.notes[0].pitch.step).toBe('G')
    expect(modern.notes[0].pitch.octave).toBe(4)
    expect(modern.notes[0].duration).toBe(4) // quarter -> 4
  })
})
