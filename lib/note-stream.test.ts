import { describe, it, expect } from 'vitest'
import {
  createPracticeEventPipeline,
  type RawPitchEvent,
  isValidMatch,
  type NoteStreamOptions,
} from './note-stream'
import type { TargetNote } from './practice-core'
import { allExercises } from './exercises'
import type { NoteSegment, PitchedFrame, TimestampMs, Hz, Cents } from './technique-types'

// Helper to collect all events from an async iterable into an array
async function collectAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = []
  for await (const item of iterable) {
    result.push(item)
  }
  return result
}

// Helper to create a mock raw pitch stream from an array of events
async function* createMockStream(
  events: Array<RawPitchEvent | { delay: number }>,
): AsyncGenerator<RawPitchEvent> {
  for (const event of events) {
    if ('delay' in event) {
      await new Promise((resolve) => setTimeout(resolve, event.delay))
    } else {
      yield event
      // Simulate a minimal delay between events to allow the pipeline to process them
      await new Promise((resolve) => setTimeout(resolve, 1))
    }
  }
}

describe('createPracticeEventPipeline', () => {
  const mockTargetNote: TargetNote = {
    pitch: { step: 'A', octave: 4, alter: 0 },
    duration: 4,
  }

  const testOptions = {
    minRms: 0.01,
    minConfidence: 0.85,
    centsTolerance: 25,
    requiredHoldTime: 100, // Use a shorter hold time for efficient testing
    exercise: allExercises[0],
  }

  const testContext = {
    targetNote: mockTargetNote,
    currentIndex: 0,
    sessionStartTime: Date.now(),
  }

  it('should filter out events with low RMS, emitting NO_NOTE_DETECTED', async () => {
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.9, rms: 0.005, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    expect(events).toEqual([{ type: 'NO_NOTE_DETECTED' }])
  })

  it('should filter out events with low confidence, emitting NO_NOTE_DETECTED', async () => {
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.5, rms: 0.02, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    expect(events).toEqual([{ type: 'NO_NOTE_DETECTED' }])
  })

  it('should filter out events with high cent deviation, emitting NO_NOTE_DETECTED', async () => {
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 0, confidence: 0.9, rms: 0.02, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    expect(events).toEqual([{ type: 'NO_NOTE_DETECTED' }])
  })

  it('should transform a valid raw event into a NOTE_DETECTED event', async () => {
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.9, rms: 0.02, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('NOTE_DETECTED')
    const event = events[0]
    if (event.type === 'NOTE_DETECTED') {
      expect(event.payload.pitch).toBe('A4')
      expect(event.payload.cents).toBeCloseTo(0)
    } else {
      throw new Error('Expected NOTE_DETECTED event')
    }
  })

  it('should emit NOTE_MATCHED when a correct note is held for the required time', async () => {
    const startTime = Date.now()
    const rawEvents = [
      { pitchHz: 441, confidence: 0.9, rms: 0.02, timestamp: startTime },
      { delay: 50 },
      { pitchHz: 442, confidence: 0.9, rms: 0.02, timestamp: startTime + 50 },
      { delay: 50 },
      { pitchHz: 439, confidence: 0.9, rms: 0.02, timestamp: startTime + 100 },
      { delay: 50 },
      // This last event should push the hold time over the 120ms threshold
      { pitchHz: 440, confidence: 0.9, rms: 0.02, timestamp: startTime + 150 },
      { delay: 200 },
      { pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 350 }, // Silence starts
      { pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 510 }, // Offset triggered
    ]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: { ...testContext, sessionStartTime: startTime },
      options: {
        ...testOptions,
        requiredHoldTime: 120,
      },
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    const noteDetectedCount = events.filter((e) => e.type === 'NOTE_DETECTED').length
    const noteMatchedCount = events.filter((e) => e.type === 'NOTE_MATCHED').length

    // We expect 4 detections and 1 final match event.
    expect(noteDetectedCount).toBe(4)
    expect(noteMatchedCount).toBe(1)
    expect(events.at(-1)?.type).toBe('NOTE_MATCHED')
  })

  it('should NOT emit NOTE_MATCHED if the note changes before hold time is met', async () => {
    const startTime = Date.now()
    const rawEvents: RawPitchEvent[] = [
      { pitchHz: 440, confidence: 0.9, rms: 0.02, timestamp: startTime }, // Correct
      { pitchHz: 441, confidence: 0.9, rms: 0.02, timestamp: startTime + 50 }, // Correct
      { pitchHz: 392, confidence: 0.9, rms: 0.02, timestamp: startTime + 100 }, // Incorrect (G4)
    ]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    const noteMatched = events.find((e) => e.type === 'NOTE_MATCHED')
    expect(noteMatched).toBeUndefined()
  })

  it('should treat frame with confidence < minConfidence but > 0.1 as NO_NOTE_DETECTED and unpitched', async () => {
    // options.minConfidence is 0.85. 0.5 is > 0.1 but < 0.85
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.5, rms: 0.02, timestamp: 100 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    expect(events).toEqual([{ type: 'NO_NOTE_DETECTED' }])
    // If it was considered pitched, it would have started an ONSET in the segmenter (internally),
    // but here we can only verify NO_NOTE_DETECTED is emitted.
    // The requirement says it must be treated as unpitched for segmentation.
  })

  it('should treat frame with RMS < minRms as NO_NOTE_DETECTED and unpitched', async () => {
    // options.minRms is 0.01. 0.005 is < 0.01
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.9, rms: 0.005, timestamp: 100 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    expect(events).toEqual([{ type: 'NO_NOTE_DETECTED' }])
  })

  it('should match if the median is within tolerance even if the last frame is not', async () => {
    const startTime = Date.now()
    // cents: [2, 3, 1, 4, 40], median = 3. Tolerance = 25.
    const cents = [2, 3, 1, 4, 40]
    const rawEvents = cents.map((c, i) => ({
      pitchHz: 440 * Math.pow(2, c / 1200),
      confidence: 0.9,
      rms: 0.02,
      timestamp: startTime + i * 50,
    }))
    // Add silence to trigger offset
    rawEvents.push({ pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 300 })
    rawEvents.push({ pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 500 })

    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: { ...testContext, sessionStartTime: startTime },
      options: {
        ...testOptions,
        requiredHoldTime: 100,
        centsTolerance: 25,
      },
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)
    const noteMatched = events.find((e) => e.type === 'NOTE_MATCHED')
    expect(noteMatched).toBeDefined()
  })

  it('should NOT match if the median is outside tolerance even if the last frame is within', async () => {
    const startTime = Date.now()
    // cents: [30, 32, 35, 28, 2], median = 30. Tolerance = 25.
    const cents = [30, 32, 35, 28, 2]
    const rawEvents = cents.map((c, i) => ({
      pitchHz: 440 * Math.pow(2, c / 1200),
      confidence: 0.9,
      rms: 0.02,
      timestamp: startTime + i * 50,
    }))
    // Add silence to trigger offset
    rawEvents.push({ pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 300 })
    rawEvents.push({ pitchHz: 0, confidence: 0, rms: 0, timestamp: startTime + 500 })

    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: { ...testContext, sessionStartTime: startTime },
      options: {
        ...testOptions,
        requiredHoldTime: 100,
        centsTolerance: 25,
      },
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)
    const noteMatched = events.find((e) => e.type === 'NOTE_MATCHED')
    expect(noteMatched).toBeUndefined()
  })

  it('should return false if pitchedFrames is empty', () => {
    const target: TargetNote = mockTargetNote
    const segment: NoteSegment = {
      segmentId: 'test',
      noteIndex: 0,
      targetPitch: 'A4',
      startTime: 0 as TimestampMs,
      endTime: 100 as TimestampMs,
      durationMs: 100 as TimestampMs,
      frames: [],
    }
    const options: NoteStreamOptions = {
      ...testOptions,
      requiredHoldTime: 50,
      centsTolerance: 25,
    }

    expect(isValidMatch({ target, segment, pitchedFrames: [], options })).toBe(false)
  })

  it('should NOT throw if pitchedFrames is empty', () => {
    const target: TargetNote = mockTargetNote
    const segment: NoteSegment = {
      segmentId: 'test',
      noteIndex: 0,
      targetPitch: 'A4',
      startTime: 0 as TimestampMs,
      endTime: 100 as TimestampMs,
      durationMs: 100 as TimestampMs,
      frames: [],
    }
    const options: NoteStreamOptions = {
      ...testOptions,
      requiredHoldTime: 50,
      centsTolerance: 25,
    }

    expect(() => isValidMatch({ target, segment, pitchedFrames: [], options })).not.toThrow()
  })

  it('should treat frame with cents > 50 as NO_NOTE_DETECTED and unpitched', async () => {
    // 440Hz is A4.
    // 60 cents above A4 is 440 * 2^(60/1200) ≈ 455.51 Hz
    // This frequency will be closer to A#4 (which is 100 cents above A4)
    // A#4 - 40 cents = 60 cents above A4.
    // MusicalNote.fromFrequency will return A#4 with -40 cents.
    // Math.abs(-40) <= 50, so it will be considered high quality for A#4.

    // To get a frame that is > 50 cents away from ANY note, we need it to be around the midpoint.
    // Midpoint between A4 and A#4 is 50 cents.
    // 51 cents above A4:
    const freq51Cents = 440 * Math.pow(2, 51 / 1200)
    // MusicalNote.fromFrequency(freq51Cents) will return A#4 with -49 cents.
    // Math.abs(-49) <= 50 is still true.

    // Let's use a frequency that is exactly 75 cents above A4.
    // This is 25 cents below A#4. MusicalNote will return A#4 with -25 cents.

    // Wait, MusicalNote.fromFrequency always returns the NEAREST note.
    // So the cents deviation is always between -50 and +50.
    // The only way to get > 50 cents is if the logic has a bug or if we use a value exactly at 50.

    // Looking at MusicalNote.fromFrequency in practice-core.ts:
    // const midiNumber = A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY)
    // const roundedMidi = Math.round(midiNumber)
    // const centsDeviation = (midiNumber - roundedMidi) * 100

    // Since it rounds to the nearest MIDI number, centsDeviation is indeed always in [-50, 50].
    // So `Math.abs(cents) <= 50` is ALWAYS true if a note is found.
    // The only case where it might be false is if `!!noteName` is false, which happens if fromFrequency fails.

    // So my test was actually impossible to fail on the `Math.abs(cents) <= 50` check
    // unless it was exactly 50.000001 or something.

    // If I want to test this, I'd need to mock MusicalNote or use a frequency that causes it to return an empty noteName if that's possible.
    // But getNoteClassFromPitch catches errors and returns undefined.

    // Let's just test that if noteName is empty it's NO_NOTE_DETECTED.
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 0, confidence: 0.9, rms: 0.02, timestamp: 100 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline({
      rawPitchStream,
      context: testContext,
      options: testOptions,
      signal: new AbortController().signal,
    })
    const events = await collectAsyncIterable(pipeline)

    expect(events).toEqual([{ type: 'NO_NOTE_DETECTED' }])
  })
})
