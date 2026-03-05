import { PracticeEngineEvent } from './engine.types'
import { AudioLoopPort, PitchDetectorPort } from './engine.ports'
import {
  createRawPitchStream,
  createPracticeEventPipeline,
  NoteStreamOptions,
} from '../note-stream'
import { Exercise } from '../exercises/types'
import { EngineState, INITIAL_ENGINE_STATE } from './engine.state'
import { PracticeReducer, engineReducer } from './engine.reducer'
import { PracticeEvent, TargetNote } from '../practice-core'

/**
 * Configuration context for the {@link PracticeEngine}.
 *
 * @public
 */
export interface PracticeEngineContext {
  /** Source of raw audio frames. */
  audio: AudioLoopPort
  /** Algorithm used to detect pitch and confidence. */
  pitch: PitchDetectorPort
  /** The musical exercise being practiced. */
  exercise: Exercise
  /** Optional custom reducer for state transitions. Defaults to {@link engineReducer}. */
  reducer?: PracticeReducer
}

/**
 * Interface for the core musical practice engine.
 *
 * @public
 */
export interface PracticeEngine {
  /**
   * Starts the asynchronous engine loop.
   *
   * @param signal - An {@link AbortSignal} to terminate the loop.
   * @returns An async iterator yielding musical events in real-time.
   */
  start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent>

  /**
   * Immediately stops the engine and releases internal resources.
   */
  stop(): void

  /**
   * Retrieves the current internal state of the engine.
   */
  getState(): EngineState
}

/**
 * Internal dependencies for the engine execution loop.
 * @internal
 */
interface EngineRunnerParams {
  ctx: PracticeEngineContext
  getState: () => EngineState
  updateState: (e: PracticeEngineEvent) => void
  getOptions: () => NoteStreamOptions
  signal: AbortSignal
}

/**
 * Parameters for executing a single note pipeline.
 * @internal
 */
interface PipelineParams {
  pipeline: AsyncIterable<PracticeEvent>
  getState: () => EngineState
  noteIndex: number
  updateState: (e: PracticeEngineEvent) => void
  signal: AbortSignal
}

/**
 * Parameters for handling a single engine event.
 * @internal
 */
interface EventHandlerParams {
  event: PracticeEngineEvent
  getState: () => EngineState
  noteIndex: number
  updateState: (e: PracticeEngineEvent) => void
}

/**
 * Calculates adaptive difficulty parameters based on performance history.
 *
 * @param perfectNoteStreak - Current streak of perfect notes.
 * @returns Object containing intonation tolerance and required hold duration.
 * @internal
 */
function calculateAdaptiveDifficulty(perfectNoteStreak: number) {
  const centsTolerance = Math.max(10, 25 - Math.floor(perfectNoteStreak / 3) * 5)
  const requiredHoldTime = Math.min(800, 500 + Math.floor(perfectNoteStreak / 5) * 100)
  return { centsTolerance, requiredHoldTime }
}

/**
 * Maps a low-level practice event to a high-level engine event.
 * @internal
 */
function mapPipelineEventToEngineEvent(event: PracticeEvent): PracticeEngineEvent | undefined {
  if (event.type === 'NOTE_DETECTED') return { type: 'NOTE_DETECTED', payload: event.payload }
  if (event.type === 'HOLDING_NOTE') return { type: 'HOLDING_NOTE', payload: event.payload }
  if (event.type === 'NOTE_MATCHED' && event.payload) {
    return {
      type: 'NOTE_MATCHED',
      payload: {
        technique: event.payload.technique,
        observations: event.payload.observations ?? [],
        isPerfect: event.payload.isPerfect ?? false,
      },
    }
  }
  return event.type === 'NO_NOTE_DETECTED' ? { type: 'NO_NOTE' } : undefined
}

/**
 * Factory function to create a new {@link PracticeEngine} instance.
 *
 * @param ctx - The execution context.
 * @returns A new PracticeEngine instance.
 * @public
 */
export function createPracticeEngine(ctx: PracticeEngineContext): PracticeEngine {
  let isRunning = false
  const reducer = ctx.reducer ?? engineReducer
  let state: EngineState = { ...INITIAL_ENGINE_STATE, scoreLength: ctx.exercise.notes.length }

  const getOptions = () => getEngineOptions(ctx.exercise, state.perfectNoteStreak)
  const updateState = (e: PracticeEngineEvent) => (state = reducer(state, e))

  return {
    async *start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent> {
      if (isRunning) return
      isRunning = true
      try {
        const params = { ctx, getState: () => state, updateState, getOptions, signal }
        yield* runEngineLoop(params)
      } finally {
        isRunning = false
      }
    },
    stop() { isRunning = false },
    getState() { return state },
  }
}

/**
 * Builds the pipeline options for the engine iteration.
 * @internal
 */
function getEngineOptions(exercise: Exercise, perfectNoteStreak: number): NoteStreamOptions {
  const { centsTolerance, requiredHoldTime } = calculateAdaptiveDifficulty(perfectNoteStreak)
  return {
    exercise,
    bpm: 60,
    centsTolerance,
    requiredHoldTime,
    minRms: 0.01,
    minConfidence: 0.85,
  }
}

/**
 * Orchestrates the main asynchronous loop for note progression.
 *
 * @param params - Execution dependencies.
 * @returns Async generator of engine events.
 * @internal
 */
async function* runEngineLoop(params: EngineRunnerParams): AsyncGenerator<PracticeEngineEvent> {
  const { ctx, getState, signal, getOptions, updateState } = params
  const stream = createRawPitchStream({ audioLoop: ctx.audio, detector: ctx.pitch, signal })
  const startTime = Date.now()

  while (getState().currentNoteIndex < getState().scoreLength && !signal.aborted) {
    const noteIndex = getState().currentNoteIndex
    const pipeline = setupPipeline(ctx.exercise, noteIndex, startTime, stream, getOptions, signal)
    yield* processPipeline({ pipeline, getState, noteIndex, updateState, signal })
  }
}

/**
 * Sets up a new practice event pipeline for the current target note.
 *
 * @param exercise - The active exercise.
 * @param noteIndex - Index of the current target note.
 * @param startTime - Reference timestamp for rhythm analysis.
 * @param stream - Source of raw pitch events.
 * @param getOptions - Provider for dynamic pipeline options.
 * @param signal - Termination token.
 * @returns An async iterable of low-level practice events.
 * @internal
 */
function setupPipeline(
  exercise: Exercise,
  noteIndex: number,
  startTime: number,
  stream: AsyncIterable<any>,
  getOptions: () => NoteStreamOptions,
  signal: AbortSignal,
) {
  const context = {
    targetNote: exercise.notes[noteIndex] as TargetNote,
    currentIndex: noteIndex,
    sessionStartTime: startTime,
  }
  return createPracticeEventPipeline(stream, context, getOptions, signal)
}

/**
 * Consumes events from the pipeline and converts them to engine events.
 *
 * @param params - Pipeline execution context.
 * @returns Async generator of mapped engine events.
 * @internal
 */
async function* processPipeline(params: PipelineParams): AsyncGenerator<PracticeEngineEvent> {
  const { pipeline, getState, noteIndex, updateState, signal } = params
  for await (const event of pipeline) {
    if (signal.aborted) break
    const engineEvent = mapPipelineEventToEngineEvent(event)
    if (engineEvent) {
      yield* handleEngineEvent({ event: engineEvent, getState, noteIndex, updateState })
      if (shouldTerminatePipeline(engineEvent, getState(), noteIndex)) break
    }
  }
}

/**
 * Updates engine state and yields events to the consumer.
 *
 * @param params - Event processing context.
 * @returns Async generator yielding the processed event.
 * @internal
 */
async function* handleEngineEvent(params: EventHandlerParams): AsyncGenerator<PracticeEngineEvent> {
  const { event, updateState, getState } = params
  updateState(event)
  yield event
  if (isTerminalEvent(event, getState())) {
    yield* finalizeSession(updateState)
  }
}

/**
 * Determines if the current pipeline iteration should terminate.
 *
 * @param event - The current engine event.
 * @param state - Current engine state.
 * @param noteIndex - The note index associated with the pipeline.
 * @returns True if the loop should break.
 * @internal
 */
function shouldTerminatePipeline(event: PracticeEngineEvent, state: EngineState, noteIndex: number): boolean {
  return isTerminalEvent(event, state) || (event.type === 'NOTE_MATCHED' && state.currentNoteIndex !== noteIndex)
}

/**
 * Checks if the practice session has reached a terminal condition.
 *
 * @param event - The current engine event.
 * @param state - Current engine state.
 * @returns True if the session is complete.
 * @internal
 */
function isTerminalEvent(event: PracticeEngineEvent, state: EngineState): boolean {
  return event.type === 'NOTE_MATCHED' && state.currentNoteIndex >= state.scoreLength
}

/**
 * Emits the final session completion event.
 *
 * @param updateState - Callback to update the engine state.
 * @returns Async generator yielding the final session completion event.
 * @internal
 */
async function* finalizeSession(updateState: (e: PracticeEngineEvent) => void): AsyncGenerator<PracticeEngineEvent> {
  const complete: PracticeEngineEvent = { type: 'SESSION_COMPLETED' }
  updateState(complete)
  yield complete
}
