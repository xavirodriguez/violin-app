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
  exercise?: Exercise
  sessionStartTime?: number
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
 * A custom iter-tools operator that implements the note stability validation logic
 * and technical analysis.
 *
 * @remarks
 * This operator processes a stream of raw pitch events, segments them into notes,
 * and performs technical analysis on completed segments. It emits `NOTE_DETECTED`
 * events for immediate UI feedback, and a `NOTE_MATCHED` event (with technique metrics)
 * only when the correct target note is held for the duration specified in
 * `options.requiredHoldTime`.
 *
 * @internal
 *
 * @param source - An async iterable of `RawPitchEvent`.
 * @param targetNote - A function that returns the current `TargetNote` to match against.
 * @param options - Configuration for the stability check and segmentation.
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
  let firstNoteOnsetTime: number | null = null

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
      yield {
        type: 'NOTE_DETECTED',
        payload: {
          pitch: noteName,
          cents: cents,
          timestamp: raw.timestamp,
          confidence: raw.confidence,
        },
      }
    } else {
      yield { type: 'NO_NOTE_DETECTED' }
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

          // Track the first note onset to align the rhythmic timeline
          if (firstNoteOnsetTime === null) {
            firstNoteOnsetTime = frames[0].timestamp
          }

          let expectedStartTime: number | undefined
          let expectedDuration: number | undefined

          if (options.exercise && firstNoteOnsetTime !== null) {
            expectedDuration = getDurationMs(
              options.exercise.notes[currentIndex].duration,
              options.bpm,
            )
            // Expected start is relative to the first note's onset
            expectedStartTime = firstNoteOnsetTime
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
        }
      }
    }
  }
}

/**
 * Constructs the final practice event pipeline by chaining together signal processing steps.
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
