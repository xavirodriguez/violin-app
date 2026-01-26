/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */

import { pipe, asyncMap } from 'iter-tools'
import {
  MusicalNote,
  type PracticeEvent,
  type DetectedNote,
  isMatch,
  type TargetNote,
} from '@/lib/practice-core'
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
  centsTolerance: number
  requiredHoldTime: number
}

const defaultOptions: NoteStreamOptions = {
  minRms: 0.01,
  minConfidence: 0.85,
  centsTolerance: 25,
  requiredHoldTime: 500,
}

/**
 * Creates an async iterable of raw pitch events from a Web Audio API AnalyserNode.
 *
 * @remarks
 * This function is the entry point for the audio processing pipeline. It runs a
 * continuous loop using `requestAnimationFrame` to capture audio data, process it
 * with the provided pitch detector, and yield the raw results. The loop's
 * lifecycle is controlled by the `isActive` callback, which must be implemented
 * by the caller to signal when the stream should terminate.
 *
 * @param analyser - The configured `AnalyserNode` from which to pull audio time-domain data.
 * @param detector - An instance of `PitchDetector` used to find the fundamental frequency.
 * @param isActive - A function that returns `false` to gracefully terminate the async generator loop.
 * @returns An `AsyncGenerator` that yields `RawPitchEvent` objects on each animation frame.
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
 * A custom iter-tools operator that implements the note stability validation logic.
 *
 * @remarks
 * This operator processes a stream of detected notes and determines if a note has
 * been held steadily for a required duration. It emits `NOTE_DETECTED` events
 * for immediate UI feedback on what the user is playing, and a `NOTE_MATCHED`
 * event only when the correct target note is held for the duration specified
 * in `options.requiredHoldTime`.
 *
 * This function maintains internal state (`validationStartTime`, `lastNote`) to
 * track the stability of a detected note over time.
 *
 * @internal
 *
 * @param source - An async iterable of `DetectedNote` or `null` (for silence).
 * @param targetNote - A function that returns the current `TargetNote` to match against.
 * @param options - Configuration for the stability check, including `requiredHoldTime`.
 * @returns An `AsyncGenerator` that yields `PracticeEvent` objects.
 */
async function* stabilityWindow(
  source: AsyncIterable<DetectedNote | null>,
  targetNote: () => TargetNote | null,
  options: NoteStreamOptions,
): AsyncGenerator<PracticeEvent> {
  let validationStartTime: number | null = null
  let lastNote: string | null = null

  for await (const detected of source) {
    const currentTarget = targetNote()
    if (!currentTarget) continue

    // Yield NOTE_DETECTED for continuous UI feedback if there is a note.
    if (detected) {
      yield { type: 'NOTE_DETECTED', payload: detected }
    } else {
      yield { type: 'NO_NOTE_DETECTED' }
    }

    const noteName = detected?.pitch ?? null

    // If the note changes or disappears, reset the timer.
    if (noteName !== lastNote) {
      validationStartTime = null
      lastNote = noteName
    }

    if (detected && isMatch(currentTarget, detected, options.centsTolerance)) {
      if (validationStartTime === null) {
        // Start of a potential match
        validationStartTime = detected.timestamp
      } else {
        // Continue validating the match
        const holdDuration = detected.timestamp - validationStartTime
        if (holdDuration >= options.requiredHoldTime) {
          yield { type: 'NOTE_MATCHED' }
          validationStartTime = null // Reset after matching
        }
      }
    } else {
      // Not a match, reset timer
      validationStartTime = null
    }
  }
}

/**
 * Constructs the final practice event pipeline by chaining together signal processing steps.
 *
 * @remarks
 * This function assembles the full processing pipeline:
 * 1. It takes the raw pitch stream as input.
 * 2. It maps raw pitch events to `DetectedNote` objects, filtering out noise and silence
 *    based on the configured RMS and confidence thresholds.
 * 3. It applies the `stabilityWindow` operator to implement the core logic of
 *    validating a held note against the current target.
 *
 * The resulting stream is consumed by the application's state management logic to
 * drive the practice mode UI.
 *
 * @param rawPitchStream - The source async iterable from `createRawPitchStream`.
 * @param targetNote - A function returning the current `TargetNote` to match against.
 * @param options - Optional configuration overrides for thresholds and timings.
 * @returns An `AsyncIterable<PracticeEvent>` ready to be consumed.
 */
export function createPracticeEventPipeline(
  rawPitchStream: AsyncIterable<RawPitchEvent>,
  targetNote: () => TargetNote | null,
  options: Partial<NoteStreamOptions> = {},
): AsyncIterable<PracticeEvent> {
  const finalOptions = { ...defaultOptions, ...options }

  const detectedNoteStream = pipe(
    rawPitchStream,
    map((rawEvent): DetectedNote | null => {
      // Condition for silence or noise: low volume or low confidence.
      if (rawEvent.rms < finalOptions.minRms || rawEvent.confidence < finalOptions.minConfidence) {
        return null
      }
      try {
        const musicalNote = MusicalNote.fromFrequency(rawEvent.pitchHz)
        return {
          pitch: musicalNote.nameWithOctave,
          cents: musicalNote.centsDeviation,
          timestamp: rawEvent.timestamp,
          confidence: rawEvent.confidence,
        }
      } catch {
        // fromFrequency can throw if pitchHz is 0.
        return null
      }
    }),
    // Add a second operator to filter out wildly out-of-tune notes for cleaner UI feedback.
    map((note) => {
      if (note && Math.abs(note.cents) > 50) {
        return null // Treat as silence if it's more than a quarter-tone off.
      }
      return note
    }),
  )

  // The final pipeline applies the stability window logic.
  return stabilityWindow(detectedNoteStream, targetNote, finalOptions)
}
