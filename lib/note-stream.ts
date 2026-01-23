/**
 * @file note-stream.ts
 *
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */

import { pipe, map, filter } from 'iter-tools'
import { MusicalNote, type PracticeEvent, type DetectedNote } from '@/lib/practice-core'
import type { PitchDetector } from '@/lib/pitch-detector'

/** The raw data coming from the pitch detector on each animation frame. */
export interface RawPitchEvent {
  pitchHz: number
  confidence: number
  rms: number
  timestamp: number
}

/** Configuration options for the note stream pipeline. */
export interface NoteStreamOptions {
  minRms: number
  minConfidence: number
}

const defaultOptions: NoteStreamOptions = {
  minRms: 0.01,
  minConfidence: 0.85,
}

/**
 * Creates an async iterable of raw pitch events from an audio source.
 */
export async function* createRawPitchStream(
  analyser: AnalyserNode,
  detector: PitchDetector,
  isActive: () => boolean,
): AsyncGenerator<RawPitchEvent> {
  const buffer = new Float32Array(analyser.fftSize)
  while (isActive()) {
    analyser.getFloatTimeDomainData(buffer)
    const result = detector.detectPitch(buffer)
    const rms = detector.calculateRMS(buffer)
    yield {
      pitchHz: result.pitchHz,
      confidence: result.confidence,
      rms: rms,
      timestamp: Date.now(),
    }
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
}

/**
 * Transforms a raw, but valid, pitch event into a PracticeEvent.
 */
function toPracticeEvent(rawEvent: RawPitchEvent): PracticeEvent {
  if (rawEvent.pitchHz === 0) {
    return { type: 'NO_NOTE_DETECTED' }
  }
  try {
    const musicalNote = MusicalNote.fromFrequency(rawEvent.pitchHz)
    const detectedNote: DetectedNote = {
      pitch: musicalNote.nameWithOctave,
      cents: musicalNote.centsDeviation,
      timestamp: rawEvent.timestamp,
      confidence: rawEvent.confidence,
    }
    return { type: 'NOTE_DETECTED', payload: detectedNote }
  } catch (error) {
    return { type: 'NO_NOTE_DETECTED' }
  }
}

/**
 * Creates the main declarative pipeline.
 */
export function createPracticeEventPipeline(
  rawPitchStream: AsyncIterable<RawPitchEvent>,
  options: Partial<NoteStreamOptions> = {},
): AsyncIterable<PracticeEvent> {
  const finalOptions = { ...defaultOptions, ...options }

  return pipe(
    rawPitchStream,
    // Step 1 (Filter): Discard events that don't meet the signal threshold.
    // This adheres to the user request of chaining at least two iter-tools operators.
    filter(
      (rawEvent) =>
        rawEvent.rms > finalOptions.minRms &&
        rawEvent.confidence > finalOptions.minConfidence,
    ),
    // Step 2 (Map): Map the clean raw data to a high-level PracticeEvent.
    map(toPracticeEvent),
  )
}
