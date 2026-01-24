/**
 * @file note-stream.ts
 *
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */

import { pipe, map, filter } from 'iter-tools'
import { asyncWindow } from '@iter-tools/async'
import {
  isMatch,
  MusicalNote,
  type PracticeEvent,
  type DetectedNote,
} from '@/lib/practice-core'
import type { PitchDetector } from '@/lib/pitch-detector'
import type { Note as TargetNote } from '@/lib/exercises/types'

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
  } catch (_error) {
    return { type: 'NO_NOTE_DETECTED' }
  }
}

/**
 * A higher-order function that returns a predicate to check note stability.
 */
function isNoteStable(targetNote: TargetNote, holdTime: number) {
  return (window: DetectedNote[]): boolean => {
    if (window.length < 2) return false
    const first = window[0]
    const last = window[window.length - 1]
    const duration = last.timestamp - first.timestamp
    return isMatch(targetNote, last) && duration >= holdTime
  }
}

/**
 * Creates the main declarative pipeline.
 */
export function createPracticeEventPipeline(
  rawPitchStream: AsyncIterable<RawPitchEvent>,
  targetNote: TargetNote,
  options: Partial<NoteStreamOptions> = {},
  requiredHoldTime = 500,
): AsyncIterable<PracticeEvent> {
  const finalOptions = { ...defaultOptions, ...options }

  // Level 1: Raw events to DetectedNotes or null
  const noteOrNullStream = pipe(
    rawPitchStream,
    map((raw) => {
      if (
        raw.rms < finalOptions.minRms ||
        raw.confidence < finalOptions.minConfidence ||
        raw.pitchHz === 0
      ) {
        return null
      }
      try {
        const musicalNote = MusicalNote.fromFrequency(raw.pitchHz)
        return {
          pitch: musicalNote.nameWithOctave,
          cents: musicalNote.centsDeviation,
          timestamp: raw.timestamp,
          confidence: raw.confidence,
        }
      } catch {
        return null
      }
    }),
  )

  // Level 2: Group consecutive identical notes
  const noteWindowStream = asyncWindow(
    (a, b) => a?.pitch === b?.pitch,
    noteOrNullStream,
  )

  // Level 3: Check for stability and emit high-level events
  return pipe(
    noteWindowStream,
    filter((window): window is DetectedNote[] => !!window[0]),
    map((window) => {
      if (isNoteStable(targetNote, requiredHoldTime)(window)) {
        return {
          type: 'NOTE_VALIDATED' as const,
          payload: window[window.length - 1],
        }
      }
      return {
        type: 'NOTE_DETECTED' as const,
        payload: window[window.length - 1],
      }
    }),
  )
}
