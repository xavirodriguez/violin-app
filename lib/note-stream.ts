/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */

import {
  MusicalNote as MusicalNoteClass,
  type PracticeEvent,
  type DetectedNote,
  isMatch,
  type TargetNote,
} from '@/lib/practice-core'
import { AudioLoopPort, PitchDetectionPort } from './ports/audio.port'
import { NoteSegmenter, type SegmenterEvent } from './note-segmenter'
import { TechniqueAnalysisAgent } from './technique-analysis-agent'
import {
  TechniqueFrame,
  NoteSegment,
  PitchedFrame,
  MusicalNoteName,
  TimestampMs,
  Hz,
  Cents,
} from './technique-types'
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
  readonly targetNote: TargetNote | null
  readonly currentIndex: number
  readonly sessionStartTime: number
}

const defaultOptions: NoteStreamOptions = {
  minRms: 0.01,
  minConfidence: 0.85,
  centsTolerance: 25,
  requiredHoldTime: 500,
  bpm: 60,
}

/**
 * Creates an async iterable of raw pitch events using audio ports.
 */
export async function* createRawPitchStream(
  audioLoop: AudioLoopPort,
  detector: PitchDetectionPort,
  signal: AbortSignal,
): AsyncGenerator<RawPitchEvent> {
  const queue: RawPitchEvent[] = []
  let resolver: (() => void) | null = null

  const loopPromise = audioLoop.start((frame) => {
    const { pitchHz, confidence } = detector.detect(frame)
    queue.push({
      pitchHz,
      confidence,
      rms: detector.calculateRMS(frame),
      timestamp: Date.now(),
    })
    if (resolver) {
      resolver()
      resolver = null
    }
  }, signal)

  try {
    while (!signal.aborted) {
      while (queue.length > 0) {
        yield queue.shift()!
      }

      if (signal.aborted) break

      await new Promise<void>((resolve) => {
        resolver = resolve
        const abortHandler = () => {
          resolve()
          resolver = null
        }
        signal.addEventListener('abort', abortHandler, { once: true })
      })
    }
  } catch (_e) {
    if (_e instanceof Error && _e.name === 'AbortError') return
    console.warn('[PIPELINE] Caught error in createRawPitchStream', _e)
  } finally {
    await loopPromise.catch(() => {}) // Cleanup
  }
}

/**
 * A custom `iter-tools` operator that implements note stability validation and technical analysis.
 */
interface TechnicalAnalysisState {
  lastGapFrames: ReadonlyArray<TechniqueFrame>
  firstNoteOnsetTime: number | null
  prevSegment: NoteSegment | null
  currentSegmentStart: number | null
}

async function* technicalAnalysisWindow(
  source: AsyncIterable<RawPitchEvent>,
  context: PipelineContext,
  optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions),
  signal: AbortSignal,
): AsyncGenerator<PracticeEvent> {
  const initialOptions = typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter
  const segmenter = new NoteSegmenter({
    minRms: initialOptions.minRms,
    minConfidence: initialOptions.minConfidence,
  })
  const agent = new TechniqueAnalysisAgent()
  const state: TechnicalAnalysisState = {
    lastGapFrames: [],
    firstNoteOnsetTime: null,
    prevSegment: null,
    currentSegmentStart: null,
  }

  for await (const raw of source) {
    if (signal.aborted) break
    const options = typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter
    yield* processRawPitchEvent({ raw, state, segmenter, agent, context, options })
    if (signal.aborted) break
  }
}

interface ProcessRawPitchOptions {
  raw: RawPitchEvent
  state: TechnicalAnalysisState
  segmenter: NoteSegmenter
  agent: TechniqueAnalysisAgent
  context: PipelineContext
  options: NoteStreamOptions
}

/**
 * Processes a single raw pitch event and yields any resulting practice events.
 */
function* processRawPitchEvent(params: ProcessRawPitchOptions): Generator<PracticeEvent> {
  const { raw, state, segmenter, agent, context, options } = params
  if (!raw || !context.targetNote) return

  const { noteName, cents } = parseMusicalNote(raw.pitchHz)
  yield* validateAndEmitDetections(raw, noteName, cents, options)

  const frame = createTechniqueFrame(raw, noteName, cents)
  const segmentEvent = segmenter.processFrame(frame)

  if (segmentEvent) {
    yield* handleSegmentEvent({ state, event: segmentEvent, context, options, agent })
  }

  if (state.currentSegmentStart !== null && frame.kind === 'pitched') {
    const holdingEvent = checkHoldingStatus(state, context.targetNote, frame, options)
    if (holdingEvent) yield holdingEvent
  }
}

function createTechniqueFrame(raw: RawPitchEvent, noteName: string, cents: number): TechniqueFrame {
  if (noteName && raw.confidence > 0.1) {
    return {
      kind: 'pitched',
      timestamp: raw.timestamp as TimestampMs,
      pitchHz: raw.pitchHz as Hz,
      cents: cents as Cents,
      rms: raw.rms,
      confidence: raw.confidence,
      noteName: noteName as MusicalNoteName,
    }
  }
  return {
    kind: 'unpitched',
    timestamp: raw.timestamp as TimestampMs,
    rms: raw.rms,
    confidence: raw.confidence,
  }
}

interface HandleSegmentEventOptions {
  state: TechnicalAnalysisState
  event: SegmenterEvent
  context: PipelineContext
  options: NoteStreamOptions
  agent: TechniqueAnalysisAgent
}

function* handleSegmentEvent(params: HandleSegmentEventOptions): Generator<PracticeEvent> {
  const { state, event, context, options, agent } = params
  if (event.type === 'ONSET') {
    state.lastGapFrames = event.gapFrames
    state.currentSegmentStart = event.timestamp
  } else if (event.type === 'OFFSET' || event.type === 'NOTE_CHANGE') {
    const completionEvent = handleSegmentCompletion({
      state,
      event,
      currentTarget: context.targetNote!,
      options,
      getCurrentIndex: () => context.currentIndex,
      agent,
    })
    if (completionEvent) yield completionEvent
    state.currentSegmentStart = event.type === 'NOTE_CHANGE' ? event.timestamp : null
  }
}

function* validateAndEmitDetections(
  raw: RawPitchEvent,
  noteName: string,
  cents: number,
  options: NoteStreamOptions,
): Generator<PracticeEvent> {
  const isHighQuality = raw.rms >= options.minRms && raw.confidence >= options.minConfidence
  if (isHighQuality && noteName && Math.abs(cents) <= 50) {
    yield {
      type: 'NOTE_DETECTED',
      payload: {
        pitch: noteName,
        pitchHz: raw.pitchHz,
        cents: cents,
        timestamp: raw.timestamp,
        confidence: raw.confidence,
      },
    }
  } else {
    yield { type: 'NO_NOTE_DETECTED' }
  }
}

interface HandleSegmentCompletionOptions {
  state: TechnicalAnalysisState
  event: Extract<SegmenterEvent, { type: 'OFFSET' | 'NOTE_CHANGE' }>
  currentTarget: TargetNote
  options: NoteStreamOptions
  getCurrentIndex: () => number
  agent: TechniqueAnalysisAgent
}

function handleSegmentCompletion(params: HandleSegmentCompletionOptions): PracticeEvent | undefined {
  const { state, event, currentTarget, options, getCurrentIndex, agent } = params
  const pitchedFrames = event.segment.frames.filter((f): f is PitchedFrame => f.kind === 'pitched')
  if (pitchedFrames.length === 0) return undefined

  const lastFrame = pitchedFrames[pitchedFrames.length - 1]
  const lastDetected = createDetectedNoteFromFrame(event.segment.targetPitch, lastFrame)
  const match = isMatch({
    target: currentTarget,
    detected: lastDetected,
    tolerance: options.centsTolerance,
  })
  if (!match || event.segment.durationMs < options.requiredHoldTime) return undefined

  return finalizeSegmentMatch({ state, segment: event.segment, options, currentIndex: getCurrentIndex(), agent })
}

function createDetectedNoteFromFrame(pitch: string, frame: PitchedFrame): DetectedNote {
  return {
    pitch,
    pitchHz: frame.pitchHz,
    cents: frame.cents,
    timestamp: frame.timestamp,
    confidence: frame.confidence,
  }
}

interface FinalizeSegmentMatchOptions {
  state: TechnicalAnalysisState
  segment: NoteSegment
  options: NoteStreamOptions
  currentIndex: number
  agent: TechniqueAnalysisAgent
}

function finalizeSegmentMatch(params: FinalizeSegmentMatchOptions): PracticeEvent {
  const { state, segment, options, currentIndex, agent } = params
  const expectations = calculateRhythmExpectations(
    options,
    currentIndex,
    state.firstNoteOnsetTime ?? segment.startTime,
  )

  const finalSegment: NoteSegment = {
    ...segment,
    noteIndex: currentIndex,
    expectedStartTime: expectations.expectedStartTime as TimestampMs,
    expectedDuration: expectations.expectedDuration as TimestampMs,
  }

  const technique = agent.analyzeSegment(finalSegment, [...state.lastGapFrames], state.prevSegment)
  const observations = agent.generateObservations(technique)

  updateStateAfterMatch(state, finalSegment)
  return { type: 'NOTE_MATCHED', payload: { technique, observations } }
}

function updateStateAfterMatch(state: TechnicalAnalysisState, segment: NoteSegment): void {
  if (state.firstNoteOnsetTime === null) state.firstNoteOnsetTime = segment.startTime
  state.prevSegment = segment
  state.lastGapFrames = []
}

function checkHoldingStatus(
  state: { currentSegmentStart: number | null },
  currentTarget: TargetNote,
  frame: PitchedFrame,
  options: NoteStreamOptions,
): PracticeEvent | undefined {
  if (state.currentSegmentStart === null) return undefined

  const lastDetected = createDetectedNoteFromFrame(frame.noteName, frame)
  const match = isMatch({
    target: currentTarget,
    detected: lastDetected,
    tolerance: options.centsTolerance,
  })

  if (match) {
    return {
      type: 'HOLDING_NOTE',
      payload: { duration: frame.timestamp - state.currentSegmentStart },
    }
  }
  return undefined
}

function parseMusicalNote(pitchHz: number) {
  let noteClass: MusicalNoteClass | undefined
  try {
    if (pitchHz > 0) {
      noteClass = MusicalNoteClass.fromFrequency(pitchHz)
    }
  } catch (_e) {
    // Ignore invalid frequencies
  }

  return {
    noteName: noteClass?.nameWithOctave ?? '',
    cents: noteClass?.centsDeviation ?? 0,
  }
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
 * Creates a practice event processing pipeline with immutable context.
 *
 * @param rawPitchStream - Raw pitch detection events
 * @param context - Immutable context snapshot. Pipeline processes events
 *   relative to THIS context. To change context, create a new pipeline.
 * @param options - Pipeline configuration
 * @param signal - AbortSignal to stop the pipeline
 * @returns An `AsyncIterable` that yields `PracticeEvent` objects.
 *
 * @remarks
 * This design prevents context drift during async iteration.
 * When the exercise note changes, create a new pipeline.
 */
export function createPracticeEventPipeline(
  rawPitchStream: AsyncIterable<RawPitchEvent>,
  context: PipelineContext,
  options: (Partial<NoteStreamOptions> & { exercise: Exercise }) | (() => NoteStreamOptions),
  signal: AbortSignal,
): AsyncIterable<PracticeEvent> {
  let optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions)
  if (typeof options === 'function') {
    optionsOrGetter = options
  } else {
    optionsOrGetter = { ...defaultOptions, ...options } as NoteStreamOptions
  }
  return technicalAnalysisWindow(rawPitchStream, context, optionsOrGetter, signal)
}
