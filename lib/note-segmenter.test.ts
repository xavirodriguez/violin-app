import { describe, it, expect } from 'vitest'
import { NoteSegmenter } from './note-segmenter'
import { TechniqueFrame } from './technique-types'

describe('NoteSegmenter', () => {
  const options = {
    minRms: 0.02,
    maxRmsSilence: 0.01,
    minConfidence: 0.8,
    onsetDebounceMs: 50,
    offsetDebounceMs: 100,
  }

  const createFrame = (ts: number, rms: number, conf: number, name: string): TechniqueFrame => ({
    timestamp: ts,
    rms,
    confidence: conf,
    noteName: name,
    pitchHz: 440,
    cents: 0
  })

  it('should detect onset after debounce', () => {
    const segmenter = new NoteSegmenter(options)

    // Silence
    expect(segmenter.processFrame(createFrame(0, 0.005, 0.5, ''))).toBeNull()

    // Signal starts
    expect(segmenter.processFrame(createFrame(10, 0.03, 0.9, 'A4'))).toBeNull()

    // After 50ms debounce
    const onset = segmenter.processFrame(createFrame(60, 0.03, 0.9, 'A4'))
    expect(onset?.type).toBe('ONSET')
    if (onset?.type === 'ONSET') {
        expect(onset.noteName).toBe('A4')
    }
  })

  it('should detect offset after debounce', () => {
    const segmenter = new NoteSegmenter(options)

    // Start note
    segmenter.processFrame(createFrame(0, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createFrame(50, 0.03, 0.9, 'A4')) // ONSET

    // Signal drops
    expect(segmenter.processFrame(createFrame(100, 0.005, 0.1, ''))).toBeNull()

    // After 100ms debounce
    const offset = segmenter.processFrame(createFrame(200, 0.005, 0.1, ''))
    expect(offset?.type).toBe('OFFSET')
  })

  it('should detect note change after 60ms debounce', () => {
    const segmenter = new NoteSegmenter(options)

    // Start note A4
    segmenter.processFrame(createFrame(0, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createFrame(50, 0.03, 0.9, 'A4')) // ONSET

    // Change to B4 - should NOT emit yet (< 60ms)
    expect(segmenter.processFrame(createFrame(100, 0.03, 0.9, 'B4'))).toBeNull()

    // After 60ms - should emit NOTE_CHANGE
    const change = segmenter.processFrame(createFrame(160, 0.03, 0.9, 'B4'))
    expect(change?.type).toBe('NOTE_CHANGE')
    if (change?.type === 'NOTE_CHANGE') {
      expect(change.noteName).toBe('B4')
    }
  })
})
