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
 * A custom iter-tools operator that implements the note stability validation logic
 * and technical analysis.
 *
 * @remarks
 * **Critical**: `targetNote` and `getCurrentIndex` are called frequently (60+ fps).
 * Ensure they:
 * 1. Are fast (\< 1ms)
 * 2. Return consistent values for the same underlying state
 * 3. Use memoized selectors from Zustand stores
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

    const segmentEvent = segmenter.processFrame(frame)
    if (segmentEvent?.type === 'ONSET') {
      lastGapFrames = segmentEvent.gapFrames
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
 * Creates a practice event processing pipeline.
 *
 * @param rawPitchStream - Raw pitch detection events
 * @param targetNote - **Function called on EVERY event** to get current target.
 *   Must be idempotent for the same index. Use a store selector.
 * @param getCurrentIndex - **Function called on EVERY event** to get current position.
 *   Must be idempotent. Use a store selector.
 * @param options - Pipeline configuration
 *
 * @remarks
 * This design prevents context drift during async iteration by using a stable context object.
 * The callbacks `targetNote` and `getCurrentIndex` allow the pipeline to react to state changes
 * in the store without recreating the entire generator if possible, but they must be consistent.
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
