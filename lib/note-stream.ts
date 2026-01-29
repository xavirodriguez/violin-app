/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */

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
import { TechniqueFrame, NoteSegment } from './technique-types'
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

/**
 * Immutable snapshot of pipeline context.
 * Captured once at pipeline creation to prevent state drift.
 */
export interface PipelineContext {
  readonly targetNote: () => TargetNote | null
  readonly getCurrentIndex: () => number
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
 */
export async function* createRawPitchStream(
  analyser: AnalyserNode,
  detector: PitchDetector,
  signal: AbortSignal,
): AsyncGenerator<RawPitchEvent> {
  const buffer = new Float32Array(analyser.fftSize)
  while (!signal.aborted) {
    analyser.getFloatTimeDomainData(buffer)
    const result = detector.detectPitch(buffer)
    const rms = detector.calculateRMS(buffer)
    yield {
      pitchHz: result.pitchHz,
      confidence: result.confidence,
      rms: rms,
      timestamp: Date.now(),
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const rafId = requestAnimationFrame(() => {
          signal.removeEventListener('abort', abortHandler)
          resolve()
        })

        function abortHandler() {
          cancelAnimationFrame(rafId)
          reject(new DOMException('Aborted', 'AbortError'))
        }

        signal.addEventListener('abort', abortHandler, { once: true })
      })
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      throw e
    }
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
  context: PipelineContext,
  options: NoteStreamOptions,
  signal: AbortSignal,
): AsyncGenerator<PracticeEvent> {
  const segmenter = new NoteSegmenter({
    minRms: options.minRms,
    minConfidence: options.minConfidence,
  })
  const agent = new TechniqueAnalysisAgent()
  let lastGapFrames: TechniqueFrame[] = []
  let firstNoteOnsetTime: number | null = null
  let prevSegment: NoteSegment | null = null
  let currentSegmentStart: number | null = null

  for await (const raw of source) {
    if (signal.aborted) break
    const currentTarget = context.targetNote()
    if (!currentTarget) continue

    const { musicalNote, noteName, cents } = parseMusicalNote(raw.pitchHz)
    yield* emitDetectionEvent(raw, musicalNote, noteName, cents, options)

    const frame: TechniqueFrame = {
      timestamp: raw.timestamp,
      pitchHz: raw.pitchHz,
      cents,
      rms: raw.rms,
      confidence: raw.confidence,
      noteName,
    }

    const lastDetected: DetectedNote = {
      pitch: noteName,
      cents: cents,
      timestamp: raw.timestamp,
      confidence: raw.confidence,
    }

    const segmentEvent = segmenter.processFrame(frame)

    if (segmentEvent?.type === 'ONSET') {
      lastGapFrames = segmentEvent.gapFrames
      currentSegmentStart = segmentEvent.timestamp
    } else if (segmentEvent?.type === 'OFFSET') {
      currentSegmentStart = null
    } else if (segmentEvent?.type === 'NOTE_CHANGE') {
      currentSegmentStart = segmentEvent.timestamp
    }

    // Emit HOLDING_NOTE if we are currently in a matching segment
    if (currentSegmentStart !== null && noteName) {
      const match = isMatch(currentTarget, lastDetected, options.centsTolerance)
      if (match) {
        yield { type: 'HOLDING_NOTE', payload: { duration: raw.timestamp - currentSegmentStart } }
      }
    }

    if (!segmentEvent || (segmentEvent.type !== 'OFFSET' && segmentEvent.type !== 'NOTE_CHANGE')) {
      continue
    }

    const result = processCompletedSegment(
      segmentEvent.frames,
      currentTarget,
      options,
      context.getCurrentIndex,
      firstNoteOnsetTime,
      lastGapFrames,
      prevSegment,
      agent,
    )

    if (result) {
      if (firstNoteOnsetTime === null) firstNoteOnsetTime = result.onsetTime
      prevSegment = result.segment
      lastGapFrames = []
      yield { type: 'NOTE_MATCHED', payload: result.payload }
    }
  }
}

/** Helper to parse a frequency into musical note components. */
function parseMusicalNote(pitchHz: number) {
  let musicalNote: MusicalNote | null = null
  try {
    if (pitchHz > 0) {
      musicalNote = MusicalNote.fromFrequency(pitchHz)
    }
  } catch {
    /* Ignore invalid frequencies */
  }
  return {
    musicalNote,
    noteName: musicalNote?.nameWithOctave ?? '',
    cents: musicalNote?.centsDeviation ?? 0,
  }
}

/** Helper to emit continuous detection feedback events. */
function* emitDetectionEvent(
  raw: RawPitchEvent,
  musicalNote: MusicalNote | null,
  noteName: string,
  cents: number,
  options: NoteStreamOptions,
): Generator<PracticeEvent> {
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
}

/** Handles the logic for a completed segment and its technical analysis. */
function processCompletedSegment(
  frames: TechniqueFrame[],
  currentTarget: TargetNote,
  options: NoteStreamOptions,
  getCurrentIndex: () => number,
  firstNoteOnsetTime: number | null,
  lastGapFrames: TechniqueFrame[],
  prevSegment: NoteSegment | null,
  agent: TechniqueAnalysisAgent,
) {
  if (frames.length === 0) return null

  const segmentNoteName = frames[0].noteName
  const targetPitch = formatTargetPitch(currentTarget)

  const lastDetected: DetectedNote = {
    pitch: segmentNoteName,
    cents: frames[frames.length - 1].cents,
    timestamp: frames[frames.length - 1].timestamp,
    confidence: frames[frames.length - 1].confidence,
  }

  const match = isMatch(currentTarget, lastDetected, options.centsTolerance)
  const duration = frames[frames.length - 1].timestamp - frames[0].timestamp

  if (!match || duration < options.requiredHoldTime) return null

  const currentIndex = getCurrentIndex()
  const onsetTime = frames[0].timestamp

  const { expectedStartTime, expectedDuration } = calculateRhythmExpectations(
    options,
    currentIndex,
    firstNoteOnsetTime ?? onsetTime,
  )

  const currentSegment: NoteSegment = {
    noteIndex: currentIndex,
    targetPitch,
    startTime: onsetTime,
    endTime: frames[frames.length - 1].timestamp,
    expectedStartTime,
    expectedDuration,
    frames,
  }

  const technique = agent.analyzeSegment(currentSegment, lastGapFrames, prevSegment)
  const observations = agent.generateObservations(technique)

  return {
    onsetTime,
    segment: currentSegment,
    payload: { technique, observations },
  }
}

function formatTargetPitch(currentTarget: TargetNote): string {
  const alter = currentTarget.pitch.alter === 1 ? '#' : currentTarget.pitch.alter === -1 ? 'b' : ''
  return `${currentTarget.pitch.step}${alter}${currentTarget.pitch.octave}`
}

function calculateRhythmExpectations(
  options: NoteStreamOptions,
  currentIndex: number,
  firstOnsetTime: number,
) {
  let expectedStartTime: number | undefined
  let expectedDuration: number | undefined

  if (options.exercise) {
    expectedDuration = getDurationMs(options.exercise.notes[currentIndex].duration, options.bpm)
    expectedStartTime = firstOnsetTime
    for (let i = 0; i < currentIndex; i++) {
      expectedStartTime += getDurationMs(options.exercise.notes[i].duration, options.bpm)
    }
  }

  return { expectedStartTime, expectedDuration }
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
  options: Partial<NoteStreamOptions> & { exercise: Exercise; sessionStartTime: number },
  signal: AbortSignal,
): AsyncIterable<PracticeEvent> {
  const finalOptions = { ...defaultOptions, ...options } as NoteStreamOptions
  const context: PipelineContext = { targetNote, getCurrentIndex }
  return technicalAnalysisWindow(rawPitchStream, context, finalOptions, signal)
}
