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
    cents: 0,
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

  it('should include accumulated frames in OFFSET event', () => {
    const segmenter = new NoteSegmenter(options)

    segmenter.processFrame(createFrame(0, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createFrame(50, 0.03, 0.9, 'A4')) // ONSET at 50ms

    segmenter.processFrame(createFrame(60, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createFrame(70, 0.03, 0.9, 'A4'))

    // Signal drops
    segmenter.processFrame(createFrame(100, 0.005, 0.1, ''))

    // OFFSET after 100ms debounce
    const offset = segmenter.processFrame(createFrame(200, 0.005, 0.1, ''))

    expect(offset?.type).toBe('OFFSET')
    if (offset?.type === 'OFFSET') {
      expect(offset.frames.length).toBe(5) // 50, 60, 70, 100, 200
      expect(offset.frames[0].timestamp).toBe(50)
      expect(offset.frames[4].timestamp).toBe(200)
    }
  })

  it('should handle and reset gapFrames correctly', () => {
    const segmenter = new NoteSegmenter(options)

    // Initial silence
    segmenter.processFrame(createFrame(0, 0.005, 0.1, ''))
    segmenter.processFrame(createFrame(10, 0.005, 0.1, ''))

    // Signal starts
    segmenter.processFrame(createFrame(20, 0.03, 0.9, 'A4'))
    const onset = segmenter.processFrame(createFrame(70, 0.03, 0.9, 'A4')) // ONSET

    expect(onset?.type).toBe('ONSET')
    if (onset?.type === 'ONSET') {
      expect(onset.gapFrames.length).toBe(4) // 0, 10, 20, 70
      expect(onset.gapFrames[0].timestamp).toBe(0)
    }

    // Next silence
    segmenter.processFrame(createFrame(100, 0.005, 0.1, ''))
    segmenter.processFrame(createFrame(200, 0.005, 0.1, '')) // OFFSET

    // New signal gap
    segmenter.processFrame(createFrame(210, 0.005, 0.1, ''))
    segmenter.processFrame(createFrame(220, 0.03, 0.9, 'A4'))
    const onset2 = segmenter.processFrame(createFrame(270, 0.03, 0.9, 'A4')) // ONSET 2

    expect(onset2?.type).toBe('ONSET')
    if (onset2?.type === 'ONSET') {
      // Should NOT include frames from the first note/silence
      expect(onset2.gapFrames.some((f) => f.timestamp === 0)).toBe(false)
      expect(onset2.gapFrames.some((f) => f.timestamp === 210)).toBe(true)
      expect(onset2.gapFrames.length).toBe(3) // 210, 220, 270
    }
  })
})
