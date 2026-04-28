import { describe, it, expect } from 'vitest'
import { createSegmenter, NoteStreamOptions } from '../lib/note-stream'
import { allExercises } from '../lib/exercises'

describe('TASK-10: minRms Invariant', () => {
  const baseOptions: NoteStreamOptions = {
    minRms: 0.01,
    minConfidence: 0.85,
    centsTolerance: 25,
    requiredHoldTime: 500,
    bpm: 60,
    exercise: allExercises[0]
  }

  it('should set segmenter minRms to 0.015 when pipeline minRms is 0.01', () => {
    const segmenter = createSegmenter(baseOptions)
    const segmenterOptions = (segmenter as any).options
    expect(segmenterOptions.minRms).toBe(0.015)
    expect(segmenterOptions.minRms).toBeGreaterThan(baseOptions.minRms)
  })

  it('should scale segmenter minRms when pipeline minRms is custom', () => {
    const customOptions = { ...baseOptions, minRms: 0.02 }
    const segmenter = createSegmenter(customOptions)
    const segmenterOptions = (segmenter as any).options
    expect(segmenterOptions.minRms).toBe(0.03) // 0.02 * 1.5
    expect(segmenterOptions.minRms).toBeGreaterThan(customOptions.minRms)
  })
})
