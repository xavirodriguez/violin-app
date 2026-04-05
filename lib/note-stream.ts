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
  NoteTechnique,
  Observation,
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
  const detection = detector.detect(frame)
  const rmsValue = detector.calculateRMS(frame)
  const currentTime = Date.now()

  state.queue.push({
    ...detection,
    rms: rmsValue,
    timestamp: currentTime,
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

  const { promise, resolve } = createSignalPromise(state)
  const abortHandler = () => {
    state.resolver = undefined
    resolve()
  }

  signal.addEventListener('abort', abortHandler, { once: true })
  await promise
  signal.removeEventListener('abort', abortHandler)
}

function createSignalPromise(state: StreamState) {
  let resolve: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
    state.resolver = r
  })
  const result = { promise, resolve: resolve! }

  return result
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

  const loopPromise = startAudioLoop({ audioLoop, state, detector, signal })
  yield* executeStreamLoop({ state, signal, loopPromise })
}

async function* executeStreamLoop(params: {
  state: StreamState
  signal: AbortSignal
  loopPromise: Promise<void>
}): AsyncGenerator<RawPitchEvent> {
  const { state, signal, loopPromise } = params
  try {
    yield* iterateStreamQueue({ state, signal })
  } catch (e) {
    handleStreamError(e)
  } finally {
    await loopPromise.catch(() => {})
  }
}

function startAudioLoop(params: {
  audioLoop: AudioLoopPort
  state: StreamState
  detector: PitchDetectionPort
  signal: AbortSignal
}): Promise<void> {
  const { audioLoop, state, detector, signal } = params
  const push = (frame: Float32Array) => pushFrameToQueue({ state, frame, detector })

  return audioLoop.start(push, signal)
}

async function* iterateStreamQueue(params: {
  state: StreamState
  signal: AbortSignal
}): AsyncGenerator<RawPitchEvent> {
  const { state, signal } = params

  while (!signal.aborted) {
    yield* drainQueue(state)
    await waitForFrame(state, signal)
  }
}

async function* drainQueue(state: StreamState): AsyncGenerator<RawPitchEvent> {
  while (state.queue.length > 0) {
    const event = state.queue.shift()
    if (event) {
      yield event
    }
  }
}

function handleStreamError(error: unknown): void {
  const isAbort = error instanceof Error && error.name === 'AbortError'
  if (isAbort) {
    return
  }

  const message = error ? String(error) : 'undefined error'
  const logPrefix = '[PIPELINE] createRawPitchStream error:'
  const finalLog = `${logPrefix} ${message}`

  console.warn(finalLog)
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
  const setup = initializeAnalysisWindow(optionsOrGetter)
  const { segmenter, agent, state } = setup

  yield* processRawStream({ source, context, optionsOrGetter, signal, segmenter, agent, state })
}

async function* processRawStream(params: {
  source: AsyncIterable<RawPitchEvent>
  context: PipelineContext
  optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions)
  signal: AbortSignal
  segmenter: NoteSegmenter
  agent: TechniqueAnalysisAgent
  state: TechnicalAnalysisState
}): AsyncGenerator<PracticeEvent> {
  const { source, signal, ...rest } = params
  for await (const raw of source) {
    if (signal.aborted) break
    yield* executeRawFrameProcessing({ ...rest, raw })
  }
}

async function* executeRawFrameProcessing(
  params: {
    raw: RawPitchEvent
    context: PipelineContext
    optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions)
    segmenter: NoteSegmenter
    agent: TechniqueAnalysisAgent
    state: TechnicalAnalysisState
  }
): AsyncGenerator<PracticeEvent> {
  const { raw, state, segmenter, agent, context, optionsOrGetter } = params
  const options = resolveOptions(optionsOrGetter)
  const procParams = { raw, state, segmenter, agent, context, options }

  yield* processSourceEvents(procParams)
}

async function* processSourceEvents(params: {
  raw: RawPitchEvent
  state: TechnicalAnalysisState
  segmenter: NoteSegmenter
  agent: TechniqueAnalysisAgent
  context: PipelineContext
  options: NoteStreamOptions
}): AsyncGenerator<PracticeEvent> {
  const { raw, state, segmenter, agent, context, options } = params
  const processParams = { raw, state, segmenter, agent, context, options }
  yield* processRawPitchEvent(processParams)
}

function initializeAnalysisWindow(
  optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions),
) {
  const initialOptions = resolveOptions(optionsOrGetter)
  const segmenter = createSegmenter(initialOptions)
  const agent = new TechniqueAnalysisAgent()
  const state = createInitialTechnicalState()

  return { segmenter, agent, state }
}

function resolveOptions(options: NoteStreamOptions | (() => NoteStreamOptions)): NoteStreamOptions {
  const isFunction = typeof options === 'function'
  const resolved = isFunction ? options() : options

  return resolved
}

function createSegmenter(options: NoteStreamOptions): NoteSegmenter {
  const segmenterConfig = {
    minRms: options.minRms,
    minConfidence: options.minConfidence,
  }

  return new NoteSegmenter(segmenterConfig)
}

function createInitialTechnicalState(): TechnicalAnalysisState {
  const state: TechnicalAnalysisState = {
    lastGapFrames: [],
    firstNoteOnsetTime: undefined,
    prevSegment: undefined,
    currentSegmentStart: undefined,
  }
  return state
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
  const { raw, context } = params
  const hasTarget = !!context.targetNote
  if (!raw || !hasTarget) return

  yield* executeEventAnalysis(params)
}

function* executeEventAnalysis(params: {
  raw: RawPitchEvent
  state: TechnicalAnalysisState
  segmenter: NoteSegmenter
  agent: TechniqueAnalysisAgent
  context: PipelineContext
  options: NoteStreamOptions
}): Generator<PracticeEvent> {
  const { raw, state, segmenter, agent, context, options } = params
  const { noteName, cents } = parseMusicalNote(raw.pitchHz)

  yield* validateAndEmitDetections({ raw, noteName, cents, options })

  const frame = convertToTechniqueFrame({ raw, noteName, cents })
  const subParams = { frame, state, segmenter, agent, context, options }
  yield* processFrameAndSegments(subParams)
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

  yield* handleDetectedSegment({ segmentEvent, state, agent, context, options })
  yield* maybeEmitHoldingEvent({ frame, state, context, options })
}

function* handleDetectedSegment(params: {
  segmentEvent: SegmenterEvent | undefined
  state: TechnicalAnalysisState
  agent: TechniqueAnalysisAgent
  context: PipelineContext
  options: NoteStreamOptions
}): Generator<PracticeEvent> {
  const { segmentEvent, state, agent, context, options } = params
  const targetNote = context.targetNote
  if (!segmentEvent || !targetNote) return

  const eventParams = prepareSegmentEventParams({
    state,
    event: segmentEvent,
    targetNote,
    options,
    agent,
    context,
  })

  yield* handleSegmentEvents(eventParams)
}

function prepareSegmentEventParams(params: {
  state: TechnicalAnalysisState
  event: SegmenterEvent
  targetNote: TargetNote
  options: NoteStreamOptions
  agent: TechniqueAnalysisAgent
  context: PipelineContext
}): SegmentEventParams {
  const { state, event, targetNote, options, agent, context } = params
  return {
    state,
    event,
    targetNote,
    options,
    agent,
    currentIndex: context.currentIndex,
  }
}


function* maybeEmitHoldingEvent(params: {
  frame: TechniqueFrame
  state: TechnicalAnalysisState
  context: PipelineContext
  options: NoteStreamOptions
}): Generator<PracticeEvent> {
  const { frame, state, context, options } = params
  const targetNote = context.targetNote
  const isHoldingCandidate = state.currentSegmentStart !== undefined && frame.kind === 'pitched' && targetNote

  if (isHoldingCandidate) {
    yield* emitHoldingIfMatched({ state, targetNote: targetNote!, frame: frame as PitchedFrame, options })
  }
}

function* emitHoldingIfMatched(params: {
  state: { currentSegmentStart: number | undefined }
  targetNote: TargetNote
  frame: PitchedFrame
  options: NoteStreamOptions
}): Generator<PracticeEvent> {
  const { state, targetNote, frame, options } = params
  const checkParams = {
    state,
    currentTarget: targetNote,
    frame,
    options,
  }

  const holdingEvent = checkHoldingStatus(checkParams)
  if (holdingEvent) {
    yield holdingEvent
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
    return createUnpitchedFrame(raw)
  }

  return createPitchedFrame({ raw, noteName, cents })
}

function createUnpitchedFrame(raw: RawPitchEvent): TechniqueFrame {
  const unpitchedFrame: TechniqueFrame = {
    kind: 'unpitched',
    timestamp: raw.timestamp as TimestampMs,
    rms: raw.rms,
    confidence: raw.confidence,
  }

  const result = unpitchedFrame
  return result
}

function createPitchedFrame(params: {
  raw: RawPitchEvent
  noteName: string
  cents: number
}): TechniqueFrame {
  const { raw, noteName, cents } = params
  const timestamp = raw.timestamp as TimestampMs
  const pitchHz = raw.pitchHz as Hz
  const centsValue = cents as Cents
  const musicalNote = noteName as MusicalNoteName

  const frame: TechniqueFrame = {
    kind: 'pitched',
    timestamp,
    pitchHz,
    cents: centsValue,
    rms: raw.rms,
    confidence: raw.confidence,
    noteName: musicalNote,
  }

  return frame
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
  const isOffset = event.type === 'OFFSET'
  const isChange = event.type === 'NOTE_CHANGE'

  if (event.type === 'ONSET') {
    state.lastGapFrames = event.gapFrames
    state.currentSegmentStart = event.timestamp
    return
  }

  const completionParams = { state, event: event as Extract<SegmenterEvent, { type: 'OFFSET' | 'NOTE_CHANGE' }>, targetNote, options, agent, currentIndex }
  yield* processCompletionEvent(completionParams)
}

function* processCompletionEvent(params: {
  state: TechnicalAnalysisState
  event: Extract<SegmenterEvent, { type: 'OFFSET' | 'NOTE_CHANGE' }>
  targetNote: TargetNote
  options: NoteStreamOptions
  agent: TechniqueAnalysisAgent
  currentIndex: number
}): Generator<PracticeEvent> {
  const { state, event, targetNote, options, agent, currentIndex } = params
  const currentTarget = targetNote
  const completion = handleSegmentCompletion({
    state,
    event,
    currentTarget,
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
  const isHighQuality = isDetectionHighQuality({ raw, noteName, cents, options })
  if (isHighQuality) {
    yield createNoteDetectedEvent({ raw, noteName, cents })
  } else {
    yield { type: 'NO_NOTE_DETECTED' }
  }
}

function createNoteDetectedEvent(params: {
  raw: RawPitchEvent
  noteName: string
  cents: number
}): PracticeEvent {
  const { raw, noteName, cents } = params
  const payload = {
    pitch: noteName,
    pitchHz: raw.pitchHz,
    cents: cents,
    timestamp: raw.timestamp,
    confidence: raw.confidence,
  }

  const event: PracticeEvent = { type: 'NOTE_DETECTED', payload }
  return event
}

function isDetectionHighQuality(params: {
  raw: RawPitchEvent
  noteName: string
  cents: number
  options: NoteStreamOptions
}): boolean {
  const { raw, noteName, cents, options } = params
  const hasRms = raw.rms >= options.minRms
  const hasConfidence = raw.confidence >= options.minConfidence
  const isPitched = !!noteName && Math.abs(cents) <= 50

  return hasRms && hasConfidence && isPitched
}

function handleSegmentCompletion(params: CompletionParams): PracticeEvent | undefined {
  const { state, event, currentTarget, options, currentIndex, agent } = params
  const segment = event.segment
  const frames = segment.frames
  const pitchedFrames = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')

  if (pitchedFrames.length === 0) return undefined

  const isMatched = currentTarget && isValidMatch({ target: currentTarget, segment, pitchedFrames, options })
  if (!isMatched) {
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

  updateStateAfterCompletion(state, finalSegment)
  const result = createMatchedEvent({ technique, agent })
  return result
}

function createMatchedEvent(params: {
  technique: NoteTechnique
  agent: TechniqueAnalysisAgent
}): PracticeEvent {
  const { technique, agent } = params
  const observations = agent.generateObservations(technique)

  const event: PracticeEvent = {
    type: 'NOTE_MATCHED',
    payload: { technique, observations },
  }
  return event
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

  const isMatched = isMatch({ target, detected: lastDetected, tolerance: options.centsTolerance })
  const isDurationValid = segment.durationMs >= options.requiredHoldTime

  const result = isMatched && isDurationValid
  return result
}

function createFinalSegment(params: {
  segment: NoteSegment
  state: TechnicalAnalysisState
  currentIndex: number
  options: NoteStreamOptions
}): NoteSegment {
  const { segment, state, currentIndex, options } = params
  const firstOnsetTime = state.firstNoteOnsetTime ?? segment.startTime
  const expectations = calculateRhythmExpectations({ options, currentIndex, firstOnsetTime })

  const finalSegment: NoteSegment = {
    ...segment,
    noteIndex: currentIndex,
    expectedStartTime: expectations.expectedStartTime as TimestampMs,
    expectedDuration: expectations.expectedDuration as TimestampMs,
  }
  return finalSegment
}

function updateStateAfterCompletion(state: TechnicalAnalysisState, segment: NoteSegment): void {
  const isFirstNote = state.firstNoteOnsetTime === undefined
  if (isFirstNote) {
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
  const start = state.currentSegmentStart
  if (start === undefined) return undefined

  const detected = createDetectedNote(frame)
  const isMatched = isMatch({ target: currentTarget, detected, tolerance: options.centsTolerance })

  if (isMatched) {
    const payload = { duration: frame.timestamp - start }
    return { type: 'HOLDING_NOTE', payload }
  }

  return undefined
}

function createDetectedNote(frame: PitchedFrame): DetectedNote {
  const note: DetectedNote = {
    pitch: frame.noteName,
    pitchHz: frame.pitchHz,
    cents: frame.cents,
    timestamp: frame.timestamp,
    confidence: frame.confidence,
  }

  const result = note
  return result
}

function parseMusicalNote(pitchHz: number) {
  const noteClass = getNoteClassFromPitch(pitchHz)
  const noteName = noteClass?.nameWithOctave ?? ''
  const cents = noteClass?.centsDeviation ?? 0
  const result = { noteName, cents }

  return result
}

function getNoteClassFromPitch(pitchHz: number): MusicalNoteClass | undefined {
  let noteClass: MusicalNoteClass | undefined = undefined
  try {
    const hasPitch = pitchHz > 0
    if (hasPitch) {
      noteClass = MusicalNoteClass.fromFrequency(pitchHz)
    }
  } catch (_e) {
    // Ignore invalid frequencies
  }

  return noteClass
}

function calculateRhythmExpectations(params: {
  options: NoteStreamOptions
  currentIndex: number
  firstOnsetTime: number
}) {
  const { options, currentIndex, firstOnsetTime } = params
  if (!options.exercise) {
    return { expectedStartTime: undefined, expectedDuration: undefined }
  }

  const expectedDuration = calculateExpectedDuration({ options, currentIndex })
  const expectedStartTime = calculateExpectedStartTime({ options, currentIndex, firstOnsetTime })

  return { expectedStartTime, expectedDuration }
}

function calculateExpectedDuration(params: {
  options: NoteStreamOptions
  currentIndex: number
}): number {
  const { options, currentIndex } = params
  const note = options.exercise!.notes[currentIndex]
  const duration = getDurationMs(note.duration, options.bpm)
  return duration
}

function calculateExpectedStartTime(params: {
  options: NoteStreamOptions
  currentIndex: number
  firstOnsetTime: number
}): number {
  const { options, currentIndex, firstOnsetTime } = params
  let startTime = firstOnsetTime
  for (let i = 0; i < currentIndex; i++) {
    const note = options.exercise!.notes[i]
    startTime += getDurationMs(note.duration, options.bpm)
  }
  return startTime
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
 */
export function createPracticeEventPipeline(params: {
  rawPitchStream: AsyncIterable<RawPitchEvent>
  context: PipelineContext
  options: (Partial<NoteStreamOptions> & { exercise: Exercise }) | (() => NoteStreamOptions)
  signal: AbortSignal
}): AsyncIterable<PracticeEvent> {
  const { rawPitchStream, context, options, signal } = params
  const optionsOrGetter = getOptionsOrGetter(options)

  return technicalAnalysisWindow({ source: rawPitchStream, context, optionsOrGetter, signal })
}

function getOptionsOrGetter(
  options: (Partial<NoteStreamOptions> & { exercise: Exercise }) | (() => NoteStreamOptions)
): NoteStreamOptions | (() => NoteStreamOptions) {
  const isFunction = typeof options === 'function'
  if (isFunction) {
    return options
  }

  const merged = { ...defaultOptions, ...options }
  const result = merged as NoteStreamOptions
  return result
}
