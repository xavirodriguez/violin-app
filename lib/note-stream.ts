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
import { AudioLoopPort, PitchDetectionPort } from './ports/audio.port'
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
      timestamp: Date.now()
    })
    if (resolver) {
      resolver()
      resolver = null
    }
  }, signal)

  try {
    while (!signal.aborted) {
      if (queue.length === 0) {
        const abortHandler = () => {
          if (resolver) {
            resolver()
            resolver = null
          }
        }
        signal.addEventListener('abort', abortHandler, { once: true })
        await new Promise<void>(resolve => {
          resolver = resolve
        })
        signal.removeEventListener('abort', abortHandler)
      }

      while (queue.length > 0 && !signal.aborted) {
        yield queue.shift()!
      }
    }
  } finally {
    await loopPromise.catch(() => {}) // Cleanup
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
/**
 * Internal state for the technical analysis window.
 */
interface TechnicalAnalysisState {
  lastGapFrames: TechniqueFrame[]
  firstNoteOnsetTime: number | null
  prevSegment: NoteSegment | null
  currentSegmentStart: number | null
}

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
  const state: TechnicalAnalysisState = {
    lastGapFrames: [],
    firstNoteOnsetTime: null,
    prevSegment: null,
    currentSegmentStart: null,
  }

  for await (const raw of source) {
    if (signal.aborted) break
    yield* processRawPitchEvent(raw, state, segmenter, agent, context, options)
  }
}

/**
 * Processes a single raw pitch event and yields any resulting practice events.
 * @internal
 */
function* processRawPitchEvent(
  raw: RawPitchEvent,
  state: TechnicalAnalysisState,
  segmenter: NoteSegmenter,
  agent: TechniqueAnalysisAgent,
  context: PipelineContext,
  options: NoteStreamOptions,
): Generator<PracticeEvent> {
  if (!raw) {
    console.warn('[PIPELINE] Source yielded null raw event')
    return
  }

  const currentTarget = context.targetNote
  if (!currentTarget) return

  const { musicalNote, noteName, cents } = parseMusicalNote(raw.pitchHz)
  yield* validateAndEmitDetections(raw, musicalNote, noteName, cents, options)

  const frame: TechniqueFrame = {
    timestamp: raw.timestamp,
    pitchHz: raw.pitchHz,
    cents,
    rms: raw.rms,
    confidence: raw.confidence,
    noteName,
  }

  const segmentEvent = segmenter.processFrame(frame)
  updateSegmentState(state, segmentEvent)

  yield* validateAndEmitHolding(state, currentTarget, frame, options)
  yield* validateAndEmitCompletion(state, segmentEvent, currentTarget, options, context, agent)
}

function* validateAndEmitDetections(
  raw: RawPitchEvent,
  musicalNote: MusicalNote | null,
  noteName: string,
  cents: number,
  options: NoteStreamOptions,
): Generator<PracticeEvent> {
  for (const event of emitDetectionEvent(raw, musicalNote, noteName, cents, options)) {
    if (!event) {
      console.warn('[INVALID EVENT] emitDetectionEvent yielded null')
      continue
    }
    yield event
  }
}

function* validateAndEmitHolding(
  state: TechnicalAnalysisState,
  currentTarget: TargetNote,
  frame: TechniqueFrame,
  options: NoteStreamOptions,
): Generator<PracticeEvent> {
  const holdingEvent = checkHoldingStatus(state, currentTarget, frame, options)
  if (holdingEvent) {
    if (!holdingEvent.type) {
      console.warn('[INVALID EVENT] holdingEvent missing type', holdingEvent)
    } else {
      yield holdingEvent
    }
  }
}

function* validateAndEmitCompletion(
  state: TechnicalAnalysisState,
  segmentEvent: ReturnType<NoteSegmenter['processFrame']>,
  currentTarget: TargetNote,
  options: NoteStreamOptions,
  context: PipelineContext,
  agent: TechniqueAnalysisAgent,
): Generator<PracticeEvent> {
  const completionEvent = handleSegmentCompletion(
    state,
    segmentEvent,
    currentTarget,
    options,
    () => context.currentIndex,
    agent,
  )
  if (completionEvent) {
    if (!completionEvent.type) {
      console.warn('[INVALID EVENT] completionEvent missing type', completionEvent)
    } else {
      yield completionEvent
    }
  }
}

function updateSegmentState(
  state: { lastGapFrames: TechniqueFrame[]; currentSegmentStart: number | null },
  event: ReturnType<NoteSegmenter['processFrame']>,
) {
  if (!event) return

  if (event.type === 'ONSET') {
    state.lastGapFrames = event.gapFrames
    state.currentSegmentStart = event.timestamp
  } else if (event.type === 'OFFSET') {
    state.currentSegmentStart = null
  } else if (event.type === 'NOTE_CHANGE') {
    state.currentSegmentStart = event.timestamp
  }
}

function handleSegmentCompletion(
  state: {
    lastGapFrames: TechniqueFrame[]
    firstNoteOnsetTime: number | null
    prevSegment: NoteSegment | null
  },
  event: ReturnType<NoteSegmenter['processFrame']>,
  currentTarget: TargetNote,
  options: NoteStreamOptions,
  getCurrentIndex: () => number,
  agent: TechniqueAnalysisAgent,
): PracticeEvent | null {
  if (!event || (event.type !== 'OFFSET' && event.type !== 'NOTE_CHANGE')) return null

  const result = processCompletedSegment(
    event.frames,
    currentTarget,
    options,
    getCurrentIndex,
    state.firstNoteOnsetTime,
    state.lastGapFrames,
    state.prevSegment,
    agent,
  )

  if (result) {
    if (state.firstNoteOnsetTime === null) state.firstNoteOnsetTime = result.onsetTime
    state.prevSegment = result.segment
    state.lastGapFrames = []
    return { type: 'NOTE_MATCHED', payload: result.payload }
  }

  return null
}

function checkHoldingStatus(
  state: { currentSegmentStart: number | null },
  currentTarget: TargetNote,
  frame: TechniqueFrame,
  options: NoteStreamOptions,
): PracticeEvent | null {
  if (state.currentSegmentStart !== null && frame && frame.noteName) {
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
  return null
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
    pitchHz: frames[frames.length - 1].pitchHz,
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
  options: Partial<NoteStreamOptions> & { exercise: Exercise },
  signal: AbortSignal,
): AsyncIterable<PracticeEvent> {
  const finalOptions = { ...defaultOptions, ...options } as NoteStreamOptions
  return technicalAnalysisWindow(rawPitchStream, context, finalOptions, signal)
}
