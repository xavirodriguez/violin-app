/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */

import { pipe, map } from 'iter-tools'
import {
  MusicalNote,
  type PracticeEvent,
  type DetectedNote,
  isMatch,
  type TargetNote,
} from '@/lib/practice-core'
import type { PitchDetector } from '@/lib/pitch-detector'
import { NoteSegmenter } from './note-segmenter'
import { TechniqueAnalysisAgent } from './technique-analysis-agent'
import { TechniqueFrame } from './technique-types'
import { getDurationMs } from './exercises/utils'
import type { Exercise } from './exercises/types'

/**
 * The raw data yielded from the pitch detector on each animation frame.
 */
export interface RawPitchEvent {
  /** The detected fundamental frequency in Hertz. */
  pitchHz: number
  /** The pitch detector's confidence in the result (0-1). */
  confidence: number
  /** The Root Mean Square (volume) of the audio buffer. */
  rms: number
  /** The timestamp when the event was generated. */
  timestamp: number
}

/**
 * Configuration options for the note stream pipeline.
 */
export interface NoteStreamOptions {
  /** The minimum RMS (volume) to consider as a valid signal. */
  minRms: number
  /** The minimum confidence score from the pitch detector to trust the result. */
  minConfidence: number
  /** The allowable pitch deviation in cents for a note to be considered a match. */
  centsTolerance: number
  /** The duration in milliseconds a note must be held to be considered "matched". */
  requiredHoldTime: number
  /** The full exercise object, used for rhythm analysis. */
  exercise?: Exercise
  /** The start time of the session, used as a reference for rhythm calculations. */
  sessionStartTime?: number
  /** The beats per minute (BPM) of the exercise, for rhythm analysis. */
  bpm: number
}

const defaultOptions: NoteStreamOptions = {
  minRms: 0.01,
  minConfidence: 0.85,
  centsTolerance: 25,
  requiredHoldTime: 500,
  bpm: 60,
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
 * A custom `iter-tools` operator that implements note stability validation and technical analysis.
 *
 * @remarks
 * This operator is the core of the practice pipeline. It consumes a stream of raw pitch events,
 * segments them into discrete notes using `NoteSegmenter`, and performs technical analysis on each
 * completed note segment via `TechniqueAnalysisAgent`.
 *
 * It emits a variety of `PracticeEvent`s:
 * - `NOTE_DETECTED`: For immediate UI feedback on what the user is playing.
 * - `NOTE_HOLD_PROGRESS`: To drive UI elements showing note stability.
 * - `NOTE_MATCHED`: The final event for a successfully held note, containing detailed technique analysis.
 *
 * This function is marked as `@internal` because it's a specialized component of the exported
 * `createPracticeEventPipeline` and not intended for direct use.
 *
 * @internal
 * @param source - An async iterable of `RawPitchEvent`.
 * @param targetNote - A selector function that returns the current `TargetNote` to match against.
 * @param options - Configuration for the stability check and segmentation.
 * @param getCurrentIndex - A selector function to get the current note's index for rhythm analysis.
 * @returns An `AsyncGenerator` that yields `PracticeEvent` objects.
 */
async function* technicalAnalysisWindow(
  source: AsyncIterable<RawPitchEvent>,
  targetNote: () => TargetNote | null,
  options: NoteStreamOptions,
  getCurrentIndex: () => number,
): AsyncGenerator<PracticeEvent> {
  const segmenter = new NoteSegmenter({
    minRms: options.minRms,
    minConfidence: options.minConfidence,
  })
  const agent = new TechniqueAnalysisAgent()
  let lastGapFrames: TechniqueFrame[] = []
  let holdStartTime = 0 // 0 indicates no active hold

  for await (const raw of source) {
    const currentTarget = targetNote()
    if (!currentTarget) continue

    let musicalNote: MusicalNote | null = null
    try {
      if (raw.pitchHz > 0) {
        musicalNote = MusicalNote.fromFrequency(raw.pitchHz)
      }
    } catch {
      // Ignore invalid frequencies
    }

    const noteName = musicalNote?.nameWithOctave ?? ''
    const cents = musicalNote?.centsDeviation ?? 0

    const isHighQuality = raw.rms >= options.minRms && raw.confidence >= options.minConfidence

    if (isHighQuality && musicalNote && Math.abs(cents) <= 50) {
      const detected: DetectedNote = {
        pitch: noteName,
        cents: cents,
        timestamp: raw.timestamp,
        confidence: raw.confidence,
      }
      yield { type: 'NOTE_DETECTED', payload: detected }

      // Check for a match to update hold duration
      if (isMatch(currentTarget, detected, options.centsTolerance)) {
        if (holdStartTime === 0) {
          holdStartTime = raw.timestamp
        }
        const holdDuration = raw.timestamp - holdStartTime
        yield { type: 'NOTE_HOLD_PROGRESS', payload: { holdDuration } }
      } else {
        // Not a match, reset hold time
        holdStartTime = 0
        yield { type: 'NOTE_HOLD_PROGRESS', payload: { holdDuration: 0 } }
      }
    } else {
      yield { type: 'NO_NOTE_DETECTED' }
      // Signal is lost, reset hold time
      holdStartTime = 0
      yield { type: 'NOTE_HOLD_PROGRESS', payload: { holdDuration: 0 } }
    }

    const frame: TechniqueFrame = {
      timestamp: raw.timestamp,
      pitchHz: raw.pitchHz,
      cents: cents,
      rms: raw.rms,
      confidence: raw.confidence,
      noteName,
    }

    const segmentEvent = segmenter.processFrame(frame)
    if (segmentEvent && segmentEvent.type === 'ONSET') {
      lastGapFrames = segmentEvent.gapFrames
    }

    if (segmentEvent && (segmentEvent.type === 'OFFSET' || segmentEvent.type === 'NOTE_CHANGE')) {
      const frames = segmentEvent.frames
      if (frames.length > 0) {
        const segmentNoteName = frames[0].noteName
        const targetPitch = `${currentTarget.pitch.step}${currentTarget.pitch.alter || ''}${currentTarget.pitch.octave}`

        // Check if the segment matches the target note
        const lastDetected: DetectedNote = {
          pitch: segmentNoteName,
          cents: frames[frames.length - 1].cents,
          timestamp: frames[frames.length - 1].timestamp,
          confidence: frames[frames.length - 1].confidence,
        }

        const match = isMatch(currentTarget, lastDetected, options.centsTolerance)
        const duration = frames[frames.length - 1].timestamp - frames[0].timestamp

        if (match && duration >= options.requiredHoldTime) {
          const currentIndex = getCurrentIndex()

          let expectedStartTime: number | undefined
          let expectedDuration: number | undefined

          if (options.exercise && options.sessionStartTime !== undefined) {
            expectedDuration = getDurationMs(
              options.exercise.notes[currentIndex].duration,
              options.bpm,
            )
            expectedStartTime = options.sessionStartTime
            for (let i = 0; i < currentIndex; i++) {
              expectedStartTime += getDurationMs(options.exercise.notes[i].duration, options.bpm)
            }
          }

          const technique = agent.analyzeSegment(
            {
              noteIndex: currentIndex,
              targetPitch,
              startTime: frames[0].timestamp,
              endTime: frames[frames.length - 1].timestamp,
              expectedStartTime,
              expectedDuration,
              frames,
            },
            lastGapFrames,
          )
          const observations = agent.generateObservations(technique)
          yield { type: 'NOTE_MATCHED', payload: { technique, observations } }
          lastGapFrames = [] // Reset after use
          holdStartTime = 0 // Reset hold timer after a successful match
        }
      }
    }
  }
}

/**
 * Constructs the final practice event pipeline by connecting the raw pitch stream
 * to the technical analysis and note stability window.
 *
 * @remarks
 * This function serves as the main factory for creating a fully configured practice event stream.
 * It encapsulates the complexity of the underlying `iter-tools` pipeline and provides a simple
 * interface for the consumer.
 *
 * @param rawPitchStream - The source `AsyncIterable` of raw pitch events, typically from `createRawPitchStream`.
 * @param targetNote - A selector function that returns the current `TargetNote` to match against.
 * @param getCurrentIndex - A selector function to get the current note's index for rhythm analysis.
 * @param options - Optional configuration overrides for the pipeline.
 * @returns An `AsyncIterable` that yields `PracticeEvent` objects.
 */
export function createPracticeEventPipeline(
  rawPitchStream: AsyncIterable<RawPitchEvent>,
  targetNote: () => TargetNote | null,
  getCurrentIndex: () => number,
  options: Partial<NoteStreamOptions> = {},
): AsyncIterable<PracticeEvent> {
  const finalOptions = { ...defaultOptions, ...options }

  // The final pipeline applies the technical analysis and stability logic.
  return technicalAnalysisWindow(rawPitchStream, targetNote, finalOptions, getCurrentIndex)
}
