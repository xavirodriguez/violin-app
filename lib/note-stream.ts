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
  type NoteName,
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
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return
    if (e) {
      console.warn('[PIPELINE] Caught error in createRawPitchStream', e)
    } else {
      console.warn('[PIPELINE] Caught null error in createRawPitchStream')
    }
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
    yield* processRawPitchEvent(raw, state, segmenter, agent, context, options)
    if (signal.aborted) break
  }
}

/**
 * Processes a single raw pitch event and yields any resulting practice events.
 *
 * @param raw - The raw pitch event from the detector.
 * @param state - Current technical analysis state.
 * @param segmenter - Note segmenter instance.
 * @param agent - Technique analysis agent.
 * @param context - Pipeline context.
 * @param options - Pipeline options.
 * @returns A generator of practice events.
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
  if (!raw) return

  const currentTarget = context.targetNote
  if (!currentTarget) return

  const { noteName, cents } = parseMusicalNote(raw.pitchHz)
  yield* validateAndEmitDetections(raw, noteName, cents, options)

  const frame: TechniqueFrame =
    noteName && raw.confidence > 0.1
      ? {
          kind: 'pitched',
          timestamp: raw.timestamp as TimestampMs,
          pitchHz: raw.pitchHz as Hz,
          cents: cents as Cents,
          rms: raw.rms,
          confidence: raw.confidence,
          noteName: noteName as MusicalNoteName,
        }
      : {
          kind: 'unpitched',
          timestamp: raw.timestamp as TimestampMs,
          rms: raw.rms,
          confidence: raw.confidence,
        }

  const segmentEvent = segmenter.processFrame(frame)

  if (segmentEvent) {
    if (segmentEvent.type === 'ONSET') {
      state.lastGapFrames = segmentEvent.gapFrames
      state.currentSegmentStart = segmentEvent.timestamp
    } else if (segmentEvent.type === 'OFFSET') {
      const completionEvent = handleSegmentCompletion(
        state,
        segmentEvent,
        currentTarget,
        options,
        () => context.currentIndex,
        agent,
      )
      if (completionEvent) yield completionEvent
      state.currentSegmentStart = null
    } else if (segmentEvent.type === 'NOTE_CHANGE') {
      const completionEvent = handleSegmentCompletion(
        state,
        segmentEvent,
        currentTarget,
        options,
        () => context.currentIndex,
        agent,
      )
      if (completionEvent) yield completionEvent
      state.currentSegmentStart = segmentEvent.timestamp
    }
  }

  if (state.currentSegmentStart !== null && frame.kind === 'pitched') {
    const holdingEvent = checkHoldingStatus(state, currentTarget, frame, options)
    if (holdingEvent) yield holdingEvent
  }
}

/**
 * Validates the quality of a detection and yields appropriate events.
 * @param raw - Raw pitch event.
 * @param noteName - Detected note name.
 * @param cents - Detected deviation.
 * @param options - Quality thresholds.
 * @returns Generator of practice events.
 * @internal
 */
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

/**
 * Handles the completion of a note segment and performs technical analysis.
 * @param state - Current analysis state.
 * @param event - Segment event (offset or note change).
 * @param currentTarget - The target note.
 * @param options - Analysis options.
 * @param getCurrentIndex - Getter for current note index.
 * @param agent - Analysis agent.
 * @returns A NOTE_MATCHED event if criteria are met, else null.
 * @internal
 */
function handleSegmentCompletion(
  state: TechnicalAnalysisState,
  event: Extract<SegmenterEvent, { type: 'OFFSET' | 'NOTE_CHANGE' }>,
  currentTarget: TargetNote,
  options: NoteStreamOptions,
  getCurrentIndex: () => number,
  agent: TechniqueAnalysisAgent,
): PracticeEvent | null {
  const segment = event.segment
  const frames = segment.frames
  const pitchedFrames = frames.filter((f): f is PitchedFrame => f.kind === 'pitched')

  if (pitchedFrames.length === 0) return null

  const lastDetected: DetectedNote = {
    pitch: segment.targetPitch,
    pitchHz: pitchedFrames[pitchedFrames.length - 1].pitchHz,
    cents: pitchedFrames[pitchedFrames.length - 1].cents,
    timestamp: segment.endTime,
    confidence: pitchedFrames[pitchedFrames.length - 1].confidence,
  }

  const match = isMatch(currentTarget, lastDetected, options.centsTolerance)
  if (!match || segment.durationMs < options.requiredHoldTime) return null

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

  if (state.firstNoteOnsetTime === null) state.firstNoteOnsetTime = segment.startTime
  state.prevSegment = finalSegment
  state.lastGapFrames = []

  return { type: 'NOTE_MATCHED', payload: { technique, observations } }
}

/**
 * Checks if the current frame maintains the required pitch for the target note.
 * @param state - Segment state.
 * @param currentTarget - Target note.
 * @param frame - Current pitched frame.
 * @param options - Tolerance options.
 * @returns A HOLDING_NOTE event if matched, else null.
 * @internal
 */
function checkHoldingStatus(
  state: { currentSegmentStart: number | null },
  currentTarget: TargetNote,
  frame: PitchedFrame,
  options: NoteStreamOptions,
): PracticeEvent | null {
  if (state.currentSegmentStart !== null) {
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

/**
 * Parses a frequency into a musical note and cents deviation.
 * @param pitchHz - Frequency in Hz.
 * @returns Object with noteName and cents.
 * @internal
 */
function parseMusicalNote(pitchHz: number) {
  let noteClass: MusicalNoteClass | null = null
  try {
    if (pitchHz > 0) {
      noteClass = MusicalNoteClass.fromFrequency(pitchHz)
    }
  } catch (e) {
    // Ignore invalid frequencies
  }

  return {
    noteName: noteClass?.nameWithOctave ?? '',
    cents: noteClass?.centsDeviation ?? 0,
  }
}


/**
 * Calculates the expected timing for a note based on BPM and exercise structure.
 * @param options - Stream options including BPM and exercise.
 * @param currentIndex - Current note index.
 * @param firstOnsetTime - Actual start time of the first note in the session.
 * @returns Expected start time and duration.
 * @internal
 */
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
 *     targetNote: usePracticeStore.getState().practiceState?.exercise.notes[0] || null,
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
