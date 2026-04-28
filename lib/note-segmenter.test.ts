import { describe, it, expect } from 'vitest'
import { NoteSegmenter, SegmenterEvent } from './note-segmenter'
import { TechniqueFrame, PitchedFrame, TimestampMs, Hz, Cents, MusicalNoteName } from './technique-types'

describe('NoteSegmenter', () => {
  const options = {
    minRms: 0.02,
    maxRmsSilence: 0.01,
    minConfidence: 0.8,
    onsetDebounceMs: 50,
    offsetDebounceMs: 100,
    maxGapFrames: 5,
    maxNoteFrames: 10,
  }

  const createPitchedFrame = (
    ts: number,
    rms: number,
    conf: number,
    name: string,
  ): TechniqueFrame => ({
    kind: 'pitched',
    timestamp: ts as TimestampMs,
    rms,
    confidence: conf,
    noteName: name as MusicalNoteName,
    pitchHz: 440 as Hz,
    cents: 0 as Cents,
  })

  const createUnpitchedFrame = (ts: number, rms: number, conf: number): TechniqueFrame => ({
    kind: 'unpitched',
    timestamp: ts as TimestampMs,
    rms,
    confidence: conf,
  })

  it('should detect onset after debounce', () => {
    const segmenter = new NoteSegmenter(options)

    // Silence
    expect(segmenter.processFrame(createUnpitchedFrame(0, 0.005, 0.5))).toBeUndefined()

    // Signal starts
    expect(segmenter.processFrame(createPitchedFrame(10, 0.03, 0.9, 'A4'))).toBeUndefined()

    // After 50ms debounce
    const onset = segmenter.processFrame(createPitchedFrame(60, 0.03, 0.9, 'A4'))
    expect(onset?.type).toBe('ONSET')
    if (onset?.type === 'ONSET') {
      expect(onset.noteName).toBe('A4')
    }
  })

  it('should detect offset after debounce', () => {
    const segmenter = new NoteSegmenter(options)

    // Start note
    segmenter.processFrame(createPitchedFrame(0, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createPitchedFrame(50, 0.03, 0.9, 'A4')) // ONSET

    // Signal drops
    expect(segmenter.processFrame(createUnpitchedFrame(100, 0.005, 0.1))).toBeUndefined()

    // After 100ms debounce
    const offset = segmenter.processFrame(createUnpitchedFrame(200, 0.005, 0.1))
    expect(offset?.type).toBe('OFFSET')
    if (offset?.type === 'OFFSET') {
      expect(offset.segment.targetPitch).toBe('A4')
      expect(offset.segment.startTime).toBe(50)
      expect(offset.segment.endTime).toBe(200)
    }
  })

  it('should detect note change after debounce', () => {
    const segmenter = new NoteSegmenter(options)

    // Start note A4
    segmenter.processFrame(createPitchedFrame(0, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createPitchedFrame(50, 0.03, 0.9, 'A4')) // ONSET

    // Change to B4 - should NOT emit yet
    expect(segmenter.processFrame(createPitchedFrame(100, 0.03, 0.9, 'B4'))).toBeUndefined()

    // After 60ms (default debounce) - should emit NOTE_CHANGE
    const change = segmenter.processFrame(createPitchedFrame(160, 0.03, 0.9, 'B4'))
    expect(change?.type).toBe('NOTE_CHANGE')
    if (change?.type === 'NOTE_CHANGE') {
      expect(change.noteName).toBe('B4')
      expect(change.segment.targetPitch).toBe('A4')
    }
  })

  it('should enforce buffer limits', () => {
    const segmenter = new NoteSegmenter(options)

    // Gap buffer limit: 5
    for (let i = 0; i < 10; i++) {
      segmenter.processFrame(createUnpitchedFrame(i * 10, 0.005, 0.1))
    }
    // Now start signal
    segmenter.processFrame(createPitchedFrame(100, 0.03, 0.9, 'A4'))
    const onset = segmenter.processFrame(createPitchedFrame(150, 0.03, 0.9, 'A4'))

    expect(onset?.type).toBe('ONSET')
    if (onset?.type === 'ONSET') {
      expect(onset.gapFrames.length).toBe(5)
      // 0, 10, 20, 30, 40, 50, 60, 70, 80, 90 -> after 100, only last 5: 60, 70, 80, 90, 100
      // then 150 is pushed -> [70, 80, 90, 100, 150]
      expect(onset.gapFrames[0].timestamp).toBe(70)
    }

    // Note buffer limit: 10
    for (let i = 0; i < 20; i++) {
      segmenter.processFrame(createPitchedFrame(200 + i * 10, 0.03, 0.9, 'A4'))
    }
    segmenter.processFrame(createUnpitchedFrame(500, 0.005, 0.1)) // Starts offset timer
    const finalOffset = segmenter.processFrame(createUnpitchedFrame(650, 0.005, 0.1))

    expect(finalOffset?.type).toBe('OFFSET')
    if (finalOffset?.type === 'OFFSET') {
      expect(finalOffset.segment.frames.length).toBe(10)
    }
  })

  it('should reset completely', () => {
    const segmenter = new NoteSegmenter(options)

    segmenter.processFrame(createPitchedFrame(0, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createPitchedFrame(50, 0.03, 0.9, 'A4')) // ONSET

    segmenter.reset()

    // Should be in SILENCE state now
    expect(segmenter.processFrame(createPitchedFrame(100, 0.03, 0.9, 'A4'))).toBeUndefined()
    const onset = segmenter.processFrame(createPitchedFrame(150, 0.03, 0.9, 'A4'))
    expect(onset?.type).toBe('ONSET')
    if (onset?.type === 'ONSET') {
      expect(onset.gapFrames.length).toBe(2) // 100, 150
    }
  })

  it('should tolerate pitch dropout if RMS remains high', () => {
    const segmenter = new NoteSegmenter({ ...options, pitchDropoutToleranceMs: 50 })

    segmenter.processFrame(createPitchedFrame(0, 0.03, 0.9, 'A4'))
    segmenter.processFrame(createPitchedFrame(50, 0.03, 0.9, 'A4')) // ONSET

    // Pitch dropout (confidence 0) but RMS high
    expect(segmenter.processFrame(createUnpitchedFrame(60, 0.03, 0.0))).toBeUndefined()
    expect(segmenter.processFrame(createUnpitchedFrame(100, 0.03, 0.0))).toBeUndefined() // 50ms since last signal

    // After dropout tolerance + offset debounce
    // lastSignalTime was at 50ms.
    // At 110ms, now - lastSignalTime = 60ms > 50ms dropout tolerance. Offset timer starts.
    expect(segmenter.processFrame(createUnpitchedFrame(110, 0.03, 0.0))).toBeUndefined()

    // 100ms offset debounce from 110ms -> 210ms
    const offset = segmenter.processFrame(createUnpitchedFrame(210, 0.03, 0.0))
    expect(offset?.type).toBe('OFFSET')
  })

  it('should generate deterministic segment IDs', () => {
    const segmenter = new NoteSegmenter({
      onsetDebounceMs: 10,
      offsetDebounceMs: 10,
      minRms: 0.01,
      maxRmsSilence: 0.005,
    })
    const frame: PitchedFrame = {
      kind: 'pitched',
      timestamp: 0 as TimestampMs,
      noteName: 'A4' as MusicalNoteName,
      pitchHz: 440 as Hz,
      cents: 0 as Cents,
      rms: 0.1,
      confidence: 0.9,
    }

    segmenter.processFrame(frame)
    const onset = segmenter.processFrame({ ...frame, timestamp: 10 as TimestampMs })
    expect(onset?.type).toBe('ONSET')

    // Start offset timer at 20ms
    segmenter.processFrame({ ...frame, timestamp: 20 as TimestampMs, rms: 0 })
    // Offset triggered at 30ms (20ms + 10ms debounce)
    const offset = segmenter.processFrame({
      ...frame,
      timestamp: 30 as TimestampMs,
      rms: 0,
    }) as Extract<SegmenterEvent, { type: 'OFFSET' }>

    expect(offset?.type).toBe('OFFSET')
    expect(offset.segment.segmentId).toBe('seg-0')

    // Second segment
    segmenter.processFrame({ ...frame, timestamp: 100 as TimestampMs })
    const onset2 = segmenter.processFrame({ ...frame, timestamp: 110 as TimestampMs })
    expect(onset2?.type).toBe('ONSET')

    // Start offset timer at 120ms
    segmenter.processFrame({ ...frame, timestamp: 120 as TimestampMs, rms: 0 })
    // Offset triggered at 130ms (120ms + 10ms debounce)
    const offset2 = segmenter.processFrame({
      ...frame,
      timestamp: 130 as TimestampMs,
      rms: 0,
    }) as Extract<SegmenterEvent, { type: 'OFFSET' }>
    expect(offset2.segment.segmentId).toBe('seg-1')
  })
})
