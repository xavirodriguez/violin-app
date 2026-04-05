import { PracticeEngineEvent } from './engine.types'
import { AudioLoopPort, PitchDetectorPort } from './engine.ports'
import {
  createRawPitchStream,
  createPracticeEventPipeline,
  NoteStreamOptions,
  RawPitchEvent,
} from '../note-stream'
import { Exercise } from '../exercises/types'
import { EngineState, INITIAL_ENGINE_STATE } from './engine.state'
import { PracticeReducer, engineReducer } from './engine.reducer'
import { PracticeEvent, TargetNote } from '../practice-core'
import { NoteTechnique, Observation } from '../technique-types'

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
  /** Optional cents tolerance override. */
  centsTolerance?: number
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
 * Factory function to create a new {@link PracticeEngine} instance.
 *
 * @param ctx - The execution context.
 * @returns A new PracticeEngine instance.
 * @public
 */
export function createPracticeEngine(ctx: PracticeEngineContext): PracticeEngine {
  const core = createEngineCore(ctx)
  const engine = buildEngineObject({ ...core, ctx })

  return engine
}

function createEngineCore(ctx: PracticeEngineContext) {
  let isRunning = false
  const reducer = ctx.reducer ?? engineReducer
  let state = getInitialEngineState(ctx.exercise)

  return {
    getState: () => state,
    updateState: (e: PracticeEngineEvent) => (state = reducer(state, e)),
    getOptions: () => getEngineOptions(ctx),
    isRunning: () => isRunning,
    setRunning: (val: boolean) => (isRunning = val),
  }
}

interface EngineBuilderParams {
  ctx: PracticeEngineContext
  getState: () => EngineState
  updateState: (e: PracticeEngineEvent) => void
  getOptions: () => NoteStreamOptions
  isRunning: () => boolean
  setRunning: (val: boolean) => void
}

function buildEngineObject(params: EngineBuilderParams): PracticeEngine {
  const { getState, setRunning } = params
  const engine: PracticeEngine = {
    start: (signal) => executeEngineStart({ ...params, signal }),
    stop: () => setRunning(false),
    getState: () => getState(),
  }
  const result = engine

  return result
}

async function* executeEngineStart(
  params: EngineBuilderParams & { signal: AbortSignal },
): AsyncGenerator<PracticeEngineEvent> {
  const { isRunning, setRunning, ...loopParams } = params
  const alreadyRunning = isRunning()
  if (alreadyRunning) return

  setRunning(true)
  try {
    yield* runEngineLoop(loopParams)
  } finally {
    setRunning(false)
  }
}

function getInitialEngineState(exercise: Exercise): EngineState {
  const noteCount = exercise.notes.length
  const initialState: EngineState = {
    ...INITIAL_ENGINE_STATE,
    scoreLength: noteCount,
  }

  const result = initialState
  return result
}

/**
 * Builds the pipeline options for the engine iteration.
 * @internal
 */
function getEngineOptions(ctx: PracticeEngineContext): NoteStreamOptions {
  const { centsTolerance, requiredHoldTime } = calculateAdaptiveDifficulty(0)
  const options = {
    exercise: ctx.exercise,
    bpm: 60,
    centsTolerance: ctx.centsTolerance ?? centsTolerance,
    requiredHoldTime,
    minRms: 0.01,
    minConfidence: 0.85,
  }

  return options
}

/**
 * Calculates adaptive difficulty parameters based on performance history.
 *
 * @param perfectNoteStreak - Current streak of perfect notes.
 * @returns Object containing intonation tolerance and required hold duration.
 * @internal
 */
function calculateAdaptiveDifficulty(perfectNoteStreak: number) {
  const streakValue = perfectNoteStreak
  const toleranceBase = 25
  const centsTolerance = Math.max(10, toleranceBase - Math.floor(streakValue / 3) * 5)
  const holdBase = 500
  const requiredHoldTime = Math.min(800, holdBase + Math.floor(streakValue / 5) * 100)

  const result = { centsTolerance, requiredHoldTime }
  return result
}

/**
 * Orchestrates the main asynchronous loop for note progression.
 *
 * @param params - Execution dependencies.
 * @returns Async generator of engine events.
 * @internal
 */
async function* runEngineLoop(params: EngineRunnerParams): AsyncGenerator<PracticeEngineEvent> {
  const { ctx, signal } = params
  const stream = createRawPitchStream({ audioLoop: ctx.audio, detector: ctx.pitch, signal })
  const startTime = Date.now()

  return yield* executeNoteLoop({ ...params, stream, startTime })
}

async function* executeNoteLoop(params: EngineRunnerParams & {
  stream: AsyncIterable<RawPitchEvent>
  startTime: number
}): AsyncGenerator<PracticeEngineEvent> {
  const { getState, signal } = params
  while (getState().currentNoteIndex < getState().scoreLength && !signal.aborted) {
    yield* iterateScoreNotes(params)
  }
}

async function* iterateScoreNotes(params: EngineRunnerParams & {
  stream: AsyncIterable<RawPitchEvent>
  startTime: number
}): AsyncGenerator<PracticeEngineEvent> {
  const pipelineParams = getPipelineParams(params)
  const pipeline = setupPipeline(pipelineParams)
  const { getState, updateState, signal } = params
  const noteIndex = getState().currentNoteIndex

  yield* processPipeline({ pipeline, getState, noteIndex, updateState, signal })
}

function getPipelineParams(params: EngineRunnerParams & {
  stream: AsyncIterable<RawPitchEvent>
  startTime: number
}): SetupPipelineParams {
  const { ctx, getState, stream, getOptions, signal, startTime } = params
  const noteIndex = getState().currentNoteIndex

  return {
    exercise: ctx.exercise,
    noteIndex,
    startTime,
    stream,
    getOptions,
    signal,
  }
}

interface SetupPipelineParams {
  exercise: Exercise
  noteIndex: number
  startTime: number
  stream: AsyncIterable<RawPitchEvent>
  getOptions: () => NoteStreamOptions
  signal: AbortSignal
}

function setupPipeline(params: SetupPipelineParams) {
  const { stream, getOptions, signal } = params
  const context = getPipelineContext(params)

  return createPracticeEventPipeline({
    rawPitchStream: stream,
    context,
    options: getOptions,
    signal,
  })
}

function getPipelineContext(params: { exercise: Exercise; noteIndex: number; startTime: number }) {
  const { exercise, noteIndex, startTime } = params
  const targetNote = exercise.notes[noteIndex] as TargetNote

  return {
    targetNote,
    currentIndex: noteIndex,
    sessionStartTime: startTime,
  }
}

/**
 * Consumes events from the pipeline and converts them to engine events.
 *
 * @param params - Pipeline execution context.
 * @returns Async generator of mapped engine events.
 * @internal
 */
async function* processPipeline(params: PipelineParams): AsyncGenerator<PracticeEngineEvent> {
  const { pipeline, signal } = params
  for await (const event of pipeline) {
    if (signal.aborted) break
    yield* handleNoteIteration({ ...params, event })
    if (checkIterationTermination({ ...params, event })) break
  }
}

async function* handleNoteIteration(
  params: PipelineParams & { event: PracticeEvent }
): AsyncGenerator<PracticeEngineEvent> {
  const { event, getState, noteIndex, updateState, signal } = params
  const engineEvent = mapPipelineEventToEngineEvent(event)

  if (engineEvent && !signal.aborted) {
    yield* handleEngineEvent({ event: engineEvent, getState, noteIndex, updateState })
  }
}

function checkIterationTermination(
  params: PipelineParams & { event: PracticeEvent }
): boolean {
  const { event, getState, noteIndex } = params
  const engineEvent = mapPipelineEventToEngineEvent(event) ?? { type: 'NO_NOTE' }
  const state = getState()

  return shouldTerminatePipeline({ event: engineEvent, state, noteIndex })
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
  const isTerminal = isTerminalEvent(event, getState())
  if (isTerminal) {
    yield* finalizeSession(updateState)
  }
}

/**
 * Maps a low-level practice event to a high-level engine event.
 * @internal
 */
function mapPipelineEventToEngineEvent(event: PracticeEvent): PracticeEngineEvent | undefined {
  if (event.type === 'NOTE_DETECTED') return { type: 'NOTE_DETECTED', payload: event.payload }
  if (event.type === 'HOLDING_NOTE') return { type: 'HOLDING_NOTE', payload: event.payload }
  if (event.type === 'NOTE_MATCHED' && event.payload) {
    return mapMatchedEvent(event.payload)
  }
  const isNoNote = event.type === 'NO_NOTE_DETECTED'
  const result = isNoNote ? { type: 'NO_NOTE' as const } : undefined

  return result
}

function mapMatchedEvent(payload: {
  technique?: NoteTechnique
  observations?: Observation[]
  isPerfect?: boolean
}): PracticeEngineEvent {
  const technique = payload.technique!
  const observations = payload.observations ?? []
  const isPerfect = payload.isPerfect ?? false

  return {
    type: 'NOTE_MATCHED',
    payload: { technique, observations, isPerfect },
  }
}

/**
 * Determines if the current pipeline iteration should terminate.
 *
 * @param params - Check parameters.
 * @returns True if the loop should break.
 * @internal
 */
function shouldTerminatePipeline(params: {
  event: PracticeEngineEvent
  state: EngineState
  noteIndex: number
}): boolean {
  const { event, state, noteIndex } = params
  const isComplete = isTerminalEvent(event, state)
  const isMatched = event.type === 'NOTE_MATCHED'
  const isNewNote = isMatched && state.currentNoteIndex !== noteIndex

  return isComplete || isNewNote
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
  const isMatch = event.type === 'NOTE_MATCHED'
  const isLastNote = state.currentNoteIndex >= state.scoreLength
  const isTerminal = isMatch && isLastNote
  const result = isTerminal

  return result
}

/**
 * Emits the final session completion event.
 *
 * @param updateState - Callback to update the engine state.
 * @returns Async generator yielding the final session completion event.
 * @internal
 */
async function* finalizeSession(
  updateState: (e: PracticeEngineEvent) => void,
): AsyncGenerator<PracticeEngineEvent> {
  const complete: PracticeEngineEvent = { type: 'SESSION_COMPLETED' }
  updateState(complete)
  yield complete
}
