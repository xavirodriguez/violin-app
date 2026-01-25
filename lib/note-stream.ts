/**
 * @file note-stream.ts
 *
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */

import { pipe, map, filter } from 'iter-tools'
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
 * A custom iter-tools operator that implements the stability window logic.
 * It yields NOTE_DETECTED for UI feedback and NOTE_MATCHED when stable.
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
  )

  // The final pipeline applies the stability window logic.
  return stabilityWindow(detectedNoteStream, targetNote, finalOptions)
}
