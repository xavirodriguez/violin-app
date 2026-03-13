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
 * Parameter object for segment completion analysis.
 */
interface CompletionParams {
  state: TechnicalAnalysisState
  event: Extract<SegmenterEvent, { type: 'OFFSET' | 'NOTE_CHANGE' }>
  currentTarget: TargetNote
  options: NoteStreamOptions
  currentIndex: number
  agent: TechniqueAnalysisAgent
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
function pushFrameToQueue(params: {
  state: StreamState
  frame: Float32Array
  detector: PitchDetectionPort
}): void {
  const { state, frame, detector } = params
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
    signal.addEventListener(
      'abort',
      () => {
        state.resolver = undefined
        resolve()
      },
      { once: true },
    )
  })
}

/**
 * Creates an async iterable of raw pitch events using audio ports.
 */
export async function* createRawPitchStream(params: {
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  signal: AbortSignal
}): AsyncGenerator<RawPitchEvent> {
  const { audioLoop, detector, signal } = params
  const state: StreamState = { queue: [] }
  const loopPromise = audioLoop.start(
    (frame) => pushFrameToQueue({ state, frame, detector }),
    signal,
  )
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

async function* technicalAnalysisWindow(params: {
  source: AsyncIterable<RawPitchEvent>
  context: PipelineContext
  optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions)
  signal: AbortSignal
}): AsyncGenerator<PracticeEvent> {
  const { source, context, optionsOrGetter, signal } = params
  const initialOptions = resolveOptions(optionsOrGetter)
  const segmenter = createSegmenter(initialOptions)
  const agent = new TechniqueAnalysisAgent()
  const state = createInitialTechnicalState()

  for await (const raw of source) {
    if (signal.aborted) break
    const options = resolveOptions(optionsOrGetter)
    yield* processRawPitchEvent({ raw, state, segmenter, agent, context, options })
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
function* processRawPitchEvent(params: {
  raw: RawPitchEvent
  state: TechnicalAnalysisState
  segmenter: NoteSegmenter
  agent: TechniqueAnalysisAgent
  context: PipelineContext
  options: NoteStreamOptions
}): Generator<PracticeEvent> {
  const { raw, state, segmenter, agent, context, options } = params
  if (!raw || !context.targetNote) return

  const { noteName, cents } = parseMusicalNote(raw.pitchHz)
  yield* validateAndEmitDetections({ raw, noteName, cents, options })

  const frame = convertToTechniqueFrame({ raw, noteName, cents })
  yield* processFrameAndSegments({ frame, state, segmenter, agent, context, options })
}

/**
 * Orchestrates segment detection and holding status for a given frame.
 * @internal
 */
function* processFrameAndSegments(params: {
  frame: TechniqueFrame
  state: TechnicalAnalysisState
  segmenter: NoteSegmenter
  agent: TechniqueAnalysisAgent
  context: PipelineContext
  options: NoteStreamOptions
}): Generator<PracticeEvent> {
  const { frame, state, segmenter, agent, context, options } = params
  const segmentEvent = segmenter.processFrame(frame)

  if (segmentEvent && context.targetNote) {
    yield* handleSegmentEvents({
      state,
      event: segmentEvent,
      targetNote: context.targetNote,
      options,
      agent,
      currentIndex: context.currentIndex,
    })
  }

  if (state.currentSegmentStart !== undefined && frame.kind === 'pitched' && context.targetNote) {
    const holdingEvent = checkHoldingStatus({
      state,
      currentTarget: context.targetNote,
      frame,
      options,
    })
    if (holdingEvent) yield holdingEvent
  }
}

function convertToTechniqueFrame(params: {
  raw: RawPitchEvent
  noteName: string
  cents: number
}): TechniqueFrame {
  const { raw, noteName, cents } = params
  const isPitched = noteName && raw.confidence > 0.1
  if (!isPitched) {
    return {
      kind: 'unpitched',
      timestamp: raw.timestamp as TimestampMs,
      rms: raw.rms,
      confidence: raw.confidence,
    }
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

interface SegmentEventParams {
  state: TechnicalAnalysisState
  event: SegmenterEvent
  targetNote: TargetNote
  options: NoteStreamOptions
  agent: TechniqueAnalysisAgent
  currentIndex: number
}

function* handleSegmentEvents(params: SegmentEventParams): Generator<PracticeEvent> {
  const { state, event, targetNote, options, agent, currentIndex } = params
  if (event.type === 'ONSET') {
    state.lastGapFrames = event.gapFrames
    state.currentSegmentStart = event.timestamp
    return
  }

  const completion = handleSegmentCompletion({
    state,
    event,
    currentTarget: targetNote,
    options,
    currentIndex,
    agent,
  })
  if (completion) yield completion
  state.currentSegmentStart = event.type === 'OFFSET' ? undefined : event.timestamp
}

function* validateAndEmitDetections(params: {
  raw: RawPitchEvent
  noteName: string
  cents: number
  options: NoteStreamOptions
}): Generator<PracticeEvent> {
  const { raw, noteName, cents, options } = params
  if (isDetectionHighQuality({ raw, noteName, cents, options })) {
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

function isDetectionHighQuality(params: {
  raw: RawPitchEvent
  noteName: string
  cents: number
  options: NoteStreamOptions
}): boolean {
  const { raw, noteName, cents, options } = params
  const hasSignal = raw.rms >= options.minRms && raw.confidence >= options.minConfidence
  return !!(hasSignal && noteName && Math.abs(cents) <= 50)
}

function handleSegmentCompletion(params: CompletionParams): PracticeEvent | undefined {
  const { state, event, currentTarget, options, currentIndex, agent } = params
  const segment = event.segment
  const pitchedFrames = segment.frames.filter((f): f is PitchedFrame => f.kind === 'pitched')

  if (pitchedFrames.length === 0) return undefined

  if (!currentTarget || !isValidMatch({ target: currentTarget, segment, pitchedFrames, options })) {
    return undefined
  }

  return finalizeSegmentAnalysis({ segment, state, currentIndex, options, agent })
}

function finalizeSegmentAnalysis(params: {
  segment: NoteSegment
  state: TechnicalAnalysisState
  currentIndex: number
  options: NoteStreamOptions
  agent: TechniqueAnalysisAgent
}): PracticeEvent {
  const { segment, state, currentIndex, options, agent } = params
  const finalSegment = createFinalSegment({ segment, state, currentIndex, options })
  const technique = agent.analyzeSegment({
    segment: finalSegment,
    gapFrames: [...state.lastGapFrames],
    prevSegment: state.prevSegment,
  })
  const observations = agent.generateObservations(technique)

  updateStateAfterCompletion(state, finalSegment)

  return { type: 'NOTE_MATCHED', payload: { technique, observations } }
}

function isValidMatch(params: {
  target: TargetNote
  segment: NoteSegment
  pitchedFrames: PitchedFrame[]
  options: NoteStreamOptions
}): boolean {
  const { target, segment, pitchedFrames, options } = params
  const lastFrame = pitchedFrames[pitchedFrames.length - 1]
  const lastDetected: DetectedNote = {
    pitch: segment.targetPitch,
    pitchHz: lastFrame.pitchHz,
    cents: lastFrame.cents,
    timestamp: segment.endTime,
    confidence: lastFrame.confidence,
  }

  return (
    isMatch({ target, detected: lastDetected, tolerance: options.centsTolerance }) &&
    segment.durationMs >= options.requiredHoldTime
  )
}

function createFinalSegment(params: {
  segment: NoteSegment
  state: TechnicalAnalysisState
  currentIndex: number
  options: NoteStreamOptions
}): NoteSegment {
  const { segment, state, currentIndex, options } = params
  const expectations = calculateRhythmExpectations({
    options,
    currentIndex,
    firstOnsetTime: state.firstNoteOnsetTime ?? segment.startTime,
  })

  return {
    ...segment,
    noteIndex: currentIndex,
    expectedStartTime: expectations.expectedStartTime as TimestampMs,
    expectedDuration: expectations.expectedDuration as TimestampMs,
  }
}

function updateStateAfterCompletion(state: TechnicalAnalysisState, segment: NoteSegment): void {
  if (state.firstNoteOnsetTime === undefined) {
    state.firstNoteOnsetTime = segment.startTime
  }
  state.prevSegment = segment
  state.lastGapFrames = []
}

function checkHoldingStatus(params: {
  state: { currentSegmentStart: number | undefined }
  currentTarget: TargetNote
  frame: PitchedFrame
  options: NoteStreamOptions
}): PracticeEvent | undefined {
  const { state, currentTarget, frame, options } = params
  if (state.currentSegmentStart !== undefined) {
    const lastDetected: DetectedNote = {
      pitch: frame.noteName,
      pitchHz: frame.pitchHz,
      cents: frame.cents,
      timestamp: frame.timestamp,
      confidence: frame.confidence,
    }
    if (
      isMatch({ target: currentTarget, detected: lastDetected, tolerance: options.centsTolerance })
    ) {
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

function calculateRhythmExpectations(params: {
  options: NoteStreamOptions
  currentIndex: number
  firstOnsetTime: number
}) {
  const { options, currentIndex, firstOnsetTime } = params
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
 * @param params - Configuration parameters for the pipeline.
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
export function createPracticeEventPipeline(params: {
  rawPitchStream: AsyncIterable<RawPitchEvent>
  context: PipelineContext
  options: (Partial<NoteStreamOptions> & { exercise: Exercise }) | (() => NoteStreamOptions)
  signal: AbortSignal
}): AsyncIterable<PracticeEvent> {
  const { rawPitchStream, context, options, signal } = params
  let optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions)
  if (typeof options === 'function') {
    optionsOrGetter = options
  } else {
    optionsOrGetter = { ...defaultOptions, ...options } as NoteStreamOptions
  }
  return technicalAnalysisWindow({ source: rawPitchStream, context, optionsOrGetter, signal })
}
