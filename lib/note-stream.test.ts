/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { WritableStream } from 'node:stream/web'
import { createPracticeEventPipeline } from '@/lib/note-stream'
import type { RawPitchEvent } from '@/lib/note-stream'
import type { Note as TargetNote } from '@/lib/exercises/types'

// A helper to push async data into a stream for testing
const createMockRawPitchStream = (events: Array<RawPitchEvent | null>) =>
  async function* () {
    for (const event of events) {
      yield event
      await new Promise((resolve) => setTimeout(resolve, 10)) // Simulate async nature
    }
  }

const MOCK_SILENCE = (timestamp: number): RawPitchEvent => ({
  pitchHz: 0,
  confidence: 0,
  rms: 0.001, // Below the default 0.01 threshold
  timestamp,
})

// A helper to collect all events from the pipeline into an array
async function collectAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = []
  for await (const value of iterable) {
    result.push(value)
  }
  return result
}

describe('createPracticeEventPipeline', () => {
  const mockTargetNote: TargetNote = {
    pitch: { step: 'A', octave: 4, alter: '' },
    duration: 1,
  }

  const getTargetNote = () => mockTargetNote

  it('should emit NOTE_MATCHED after a stable correct note', async () => {
    const pitchEvents: (RawPitchEvent | null)[] = [
      // Correct note, held stable
      { pitchHz: 440, confidence: 0.9, rms: 0.1, timestamp: 1000 },
      { pitchHz: 441, confidence: 0.9, rms: 0.1, timestamp: 1200 },
      { pitchHz: 439, confidence: 0.9, rms: 0.1, timestamp: 1400 },
      { pitchHz: 440, confidence: 0.9, rms: 0.1, timestamp: 1600 },
    ]

    const rawPitchStream = createMockRawPitchStream(pitchEvents)()
    const pipeline = createPracticeEventPipeline(rawPitchStream, getTargetNote, {
      requiredHoldTime: 500,
    })

    const events = await collectAsyncIterable(pipeline)

    // Should emit NOTE_DETECTED for each valid input
    expect(events.filter((e) => e.type === 'NOTE_DETECTED')).toHaveLength(4)

    // Should emit exactly one NOTE_MATCHED event
    const matchedEvents = events.filter((e) => e.type === 'NOTE_MATCHED')
    expect(matchedEvents).toHaveLength(1)
  })

  it('should not emit NOTE_MATCHED if note is unstable', async () => {
    const pitchEvents: (RawPitchEvent | null)[] = [
      { pitchHz: 440, confidence: 0.9, rms: 0.1, timestamp: 1000 }, // Correct
      null, // Silence resets stability
      { pitchHz: 440, confidence: 0.9, rms: 0.1, timestamp: 1200 }, // Correct again
    ]

    const rawPitchStream = createMockRawPitchStream(pitchEvents)()
    const pipeline = createPracticeEventPipeline(rawPitchStream, getTargetNote, {
      requiredHoldTime: 300,
    })

    const events = await collectAsyncIterable(pipeline)

    expect(events.filter((e) => e.type === 'NOTE_MATCHED')).toHaveLength(0)
    // We expect 2 NOTE_DETECTED events and 1 NO_NOTE_DETECTED event
    expect(events.filter((e) => e.type === 'NOTE_DETECTED')).toHaveLength(2)
    expect(events.filter((e) => e.type === 'NO_NOTE_DETECTED')).toHaveLength(1)
  })

  it('should reset stability timer if a wrong note is played', async () => {
    const pitchEvents: (RawPitchEvent | null)[] = [
      { pitchHz: 440, confidence: 0.9, rms: 0.1, timestamp: 1000 }, // Correct, starts timer
      { pitchHz: 441, confidence: 0.9, rms: 0.1, timestamp: 1200 }, // Still correct
      { pitchHz: 330, confidence: 0.9, rms: 0.1, timestamp: 1400 }, // Incorrect (E4), resets timer
      { pitchHz: 440, confidence: 0.9, rms: 0.1, timestamp: 1600 }, // Correct, starts new timer
      { pitchHz: 439, confidence: 0.9, rms: 0.1, timestamp: 1800 },
      { pitchHz: 440, confidence: 0.9, rms: 0.1, timestamp: 2200 }, // Match!
    ]

    const rawPitchStream = createMockRawPitchStream(pitchEvents)()
    const pipeline = createPracticeEventPipeline(rawPitchStream, getTargetNote, {
      requiredHoldTime: 500,
    })
    const events = await collectAsyncIterable(pipeline)
    expect(events.filter((e) => e.type === 'NOTE_MATCHED')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'NOTE_DETECTED')).toHaveLength(6)
  })
})
