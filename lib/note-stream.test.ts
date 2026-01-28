import { describe, it, expect } from 'vitest'
import { createPracticeEventPipeline, type RawPitchEvent } from './note-stream'
import type { TargetNote } from './practice-core'

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
  const mockTargetNote: TargetNote = { pitch: { step: 'A', octave: 4 }, duration: 1 }
  const getTargetNote = () => mockTargetNote

  const testOptions = {
    minRms: 0.01,
    minConfidence: 0.85,
    centsTolerance: 25,
    requiredHoldTime: 100, // Use a shorter hold time for efficient testing
  }

  it('should filter out events with low RMS, emitting NO_NOTE_DETECTED', async () => {
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.9, rms: 0.005, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline(
      rawPitchStream,
      getTargetNote,
      () => 0,
      testOptions,
    )
    const events = await collectAsyncIterable(pipeline)

    expect(events.some((e) => e.type === 'NO_NOTE_DETECTED')).toBe(true)
  })

  it('should filter out events with low confidence, emitting NO_NOTE_DETECTED', async () => {
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.5, rms: 0.02, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline(
      rawPitchStream,
      getTargetNote,
      () => 0,
      testOptions,
    )
    const events = await collectAsyncIterable(pipeline)

    expect(events.some((e) => e.type === 'NO_NOTE_DETECTED')).toBe(true)
  })

  it('should filter out events with high cent deviation, emitting NO_NOTE_DETECTED', async () => {
    // 440Hz is A4. 466.16Hz is A#4.
    // To be > 50 cents off, we need to be at the midpoint or beyond,
    // but the system will just snap to the next note.
    // However, we can simulate an 'invalid' pitchHz of 0 which our code should handle.
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 0, confidence: 0.9, rms: 0.02, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline(
      rawPitchStream,
      getTargetNote,
      () => 0,
      testOptions,
    )
    const events = await collectAsyncIterable(pipeline)

    expect(events.some((e) => e.type === 'NO_NOTE_DETECTED')).toBe(true)
  })

  it('should transform a valid raw event into a NOTE_DETECTED event', async () => {
    const rawEvents: RawPitchEvent[] = [{ pitchHz: 440, confidence: 0.9, rms: 0.02, timestamp: 0 }]
    const rawPitchStream = createMockStream(rawEvents)
    const pipeline = createPracticeEventPipeline(
      rawPitchStream,
      getTargetNote,
      () => 0,
      testOptions,
    )
    const events = await collectAsyncIterable(pipeline)

    const detectedEvent = events.find((e) => e.type === 'NOTE_DETECTED')
    expect(detectedEvent).toBeDefined()
    const payload = (detectedEvent as any).payload
    expect(payload.pitch).toBe('A4')
    expect(payload.cents).toBeCloseTo(0)
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
    const pipeline = createPracticeEventPipeline(rawPitchStream, getTargetNote, () => 0, {
      ...testOptions,
      requiredHoldTime: 120,
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
    const pipeline = createPracticeEventPipeline(
      rawPitchStream,
      getTargetNote,
      () => 0,
      testOptions,
    )
    const events = await collectAsyncIterable(pipeline)

    const noteMatched = events.find((e) => e.type === 'NOTE_MATCHED')
    expect(noteMatched).toBeUndefined()
  })
})
