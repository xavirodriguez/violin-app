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
  readonly targetNote: TargetNote | undefined
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

interface StreamState {
  queue: RawPitchEvent[]
  resolver?: () => void
}

/**
 * Pushes a new pitch detection frame into the event queue and wakes the consumer.
 */
function pushFrameToQueue(state: StreamState, frame: Float32Array, detector: PitchDetectionPort): void {
  state.queue.push({
    ...detector.detect(frame),
    rms: detector.calculateRMS(frame),
    timestamp: Date.now(),
  })
  if (state.resolver) {
    state.resolver()
    state.resolver = undefined
  }
}

/**
 * Waits for the next frame to be pushed into the queue.
 */
async function waitForFrame(state: StreamState, signal: AbortSignal): Promise<void> {
  if (state.queue.length > 0 || signal.aborted) return
  await new Promise<void>((resolve) => {
    state.resolver = resolve
    signal.addEventListener('abort', () => {
      state.resolver = undefined
      resolve()
    }, { once: true })
  })
}

/**
 * Creates an async iterable of raw pitch events using audio ports.
 */
export async function* createRawPitchStream(
  audioLoop: AudioLoopPort,
  detector: PitchDetectionPort,
  signal: AbortSignal,
): AsyncGenerator<RawPitchEvent> {
  const state: StreamState = { queue: [] }
  const loopPromise = audioLoop.start((frame) => pushFrameToQueue(state, frame, detector), signal)
  try {
    while (!signal.aborted) {
      while (state.queue.length > 0) yield state.queue.shift()!
      await waitForFrame(state, signal)
    }
  } catch (e) {
    handleStreamError(e)
  } finally {
    await loopPromise.catch(() => {})
  }
}

function handleStreamError(error: unknown): void {
  if (error instanceof Error && error.name === 'AbortError') return
  const message = error ? String(error) : 'undefined error'
  console.warn(`[PIPELINE] createRawPitchStream error: ${message}`)
}

/**
 * A custom `iter-tools` operator that implements note stability validation and technical analysis.
 */
interface TechnicalAnalysisState {
  lastGapFrames: ReadonlyArray<TechniqueFrame>
  firstNoteOnsetTime: number | undefined
  prevSegment: NoteSegment | undefined
  currentSegmentStart: number | undefined
}

async function* technicalAnalysisWindow(
  source: AsyncIterable<RawPitchEvent>,
  context: PipelineContext,
  optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions),
  signal: AbortSignal,
): AsyncGenerator<PracticeEvent> {
  const initialOptions = resolveOptions(optionsOrGetter)
  const segmenter = createSegmenter(initialOptions)
  const agent = new TechniqueAnalysisAgent()
  const state = createInitialTechnicalState()

  for await (const raw of source) {
    if (signal.aborted) break
    const options = resolveOptions(optionsOrGetter)
    yield* processRawPitchEvent(raw, state, segmenter, agent, context, options)
    if (signal.aborted) break
  }
}

function resolveOptions(options: NoteStreamOptions | (() => NoteStreamOptions)): NoteStreamOptions {
  return typeof options === 'function' ? options() : options
}

function createSegmenter(options: NoteStreamOptions): NoteSegmenter {
  return new NoteSegmenter({ minRms: options.minRms, minConfidence: options.minConfidence })
}

function createInitialTechnicalState(): TechnicalAnalysisState {
  return {
    lastGapFrames: [],
    firstNoteOnsetTime: undefined,
    prevSegment: undefined,
    currentSegmentStart: undefined,
  }
}

/**
 * Processes a single raw pitch event and yields any resulting practice events.
 */
function* processRawPitchEvent(
  raw: RawPitchEvent,
  state: TechnicalAnalysisState,
  segmenter: NoteSegmenter,
  agent: TechniqueAnalysisAgent,
  context: PipelineContext,
  options: NoteStreamOptions,
): Generator<PracticeEvent> {
  if (!raw || !context.targetNote) return

  const { noteName, cents } = parseMusicalNote(raw.pitchHz)
  yield* validateAndEmitDetections(raw, noteName, cents, options)

  const frame = convertToTechniqueFrame(raw, noteName, cents)
  const segmentEvent = segmenter.processFrame(frame)

  if (segmentEvent) {
    yield* handleSegmentEvents(state, segmentEvent, context, options, agent)
  }

  if (state.currentSegmentStart !== undefined && frame.kind === 'pitched') {
    const holdingEvent = checkHoldingStatus(state, context.targetNote, frame, options)
    if (holdingEvent) yield holdingEvent
  }
}

function convertToTechniqueFrame(raw: RawPitchEvent, noteName: string, cents: number): TechniqueFrame {
  const isPitched = noteName && raw.confidence > 0.1
  if (!isPitched) {
    return { kind: 'unpitched', timestamp: raw.timestamp as TimestampMs, rms: raw.rms, confidence: raw.confidence }
  }
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

function* handleSegmentEvents(
  state: TechnicalAnalysisState,
  event: SegmenterEvent,
  context: PipelineContext,
  options: NoteStreamOptions,
  agent: TechniqueAnalysisAgent
): Generator<PracticeEvent> {
  if (event.type === 'ONSET') {
    state.lastGapFrames = event.gapFrames
    state.currentSegmentStart = event.timestamp
  } else if (event.type === 'OFFSET' || event.type === 'NOTE_CHANGE') {
    const completion = handleSegmentCompletion(state, event, context.targetNote!, options, () => context.currentIndex, agent)
    if (completion) yield completion
    state.currentSegmentStart = event.type === 'OFFSET' ? undefined : event.timestamp
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

function handleSegmentCompletion(
  state: TechnicalAnalysisState,
  event: Extract<SegmenterEvent, { type: 'OFFSET' | 'NOTE_CHANGE' }>,
  currentTarget: TargetNote,
  options: NoteStreamOptions,
  getCurrentIndex: () => number,
  agent: TechniqueAnalysisAgent,
): PracticeEvent | undefined {
  const segment = event.segment
  const frames = segment.frames
  const pitchedFrames = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')

  if (pitchedFrames.length === 0) return undefined

  const lastDetected: DetectedNote = {
    pitch: segment.targetPitch,
    pitchHz: pitchedFrames[pitchedFrames.length - 1].pitchHz,
    cents: pitchedFrames[pitchedFrames.length - 1].cents,
    timestamp: segment.endTime,
    confidence: pitchedFrames[pitchedFrames.length - 1].confidence,
  }

  const match = isMatch(currentTarget, lastDetected, options.centsTolerance)
  if (!match || segment.durationMs < options.requiredHoldTime) return undefined

  const currentIndex = getCurrentIndex()
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

  if (state.firstNoteOnsetTime === undefined) state.firstNoteOnsetTime = segment.startTime
  state.prevSegment = finalSegment
  state.lastGapFrames = []

  return { type: 'NOTE_MATCHED', payload: { technique, observations } }
}

function checkHoldingStatus(
  state: { currentSegmentStart: number | undefined },
  currentTarget: TargetNote,
  frame: PitchedFrame,
  options: NoteStreamOptions,
): PracticeEvent | undefined {
  if (state.currentSegmentStart !== undefined) {
    const lastDetected: DetectedNote = {
      pitch: frame.noteName,
      pitchHz: frame.pitchHz,
      cents: frame.cents,
      timestamp: frame.timestamp,
      confidence: frame.confidence,
    }
    const match = isMatch(currentTarget, lastDetected, options.centsTolerance)
    if (match) {
      return {
        type: 'HOLDING_NOTE',
        payload: { duration: frame.timestamp - state.currentSegmentStart },
      }
    }
  }
  return undefined
}

function parseMusicalNote(pitchHz: number) {
  let noteClass: MusicalNoteClass | undefined = undefined
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
 *
 * **Critical Performance**: The pipeline runs at 60+ fps.
 * Ensure that any dynamic options provided as getters:
 * 1. Are fast (`< 1ms`)
 * 2. Return consistent values for the same underlying state
 * 3. Use memoized selectors if possible
 *
 * @example
 * ```ts
 * const pipeline = createPracticeEventPipeline(
 *   rawStream,
 *   {
 *     targetNote: usePracticeStore.getState().practiceState?.exercise.notes[0] || undefined,
 *     currentIndex: 0,
 *     sessionStartTime: Date.now(),
 *   },
 *   options,
 *   signal
 * );
 * ```
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
