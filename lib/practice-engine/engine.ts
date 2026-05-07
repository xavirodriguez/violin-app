import { PracticeEngineEvent } from './engine.types'
import { AudioLoopPort, PitchDetectorPort } from './engine.ports'
import {
  createRawPitchStream,
  initializeAnalysisWindow,
  processRawPitchEvent,
  resolveOptions,
  NoteStreamOptions,
  RawPitchEvent,
} from '../note-stream'
import { Exercise } from '../exercises/types'
import { EngineState, INITIAL_ENGINE_STATE } from './engine.state'
import { PracticeReducer, engineReducer } from './engine.reducer'
import { PracticeEvent, TargetNote } from '../practice-core'
import { NoteTechnique, Observation } from '../technique-types'
import { AppError, ERROR_CODES } from '../errors/app-error'

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
  /** The index of the note to start practicing from. */
  initialNoteIndex?: number
  /** The minimum RMS threshold for signal detection. */
  minRms?: number
}

/**
 * Interface for the core musical practice engine.
 *
 * @remarks
 * The PracticeEngine is the central orchestrator for a musical practice session.
 * It is responsible for:
 * 1. **Audio Integration**: Consuming raw frames from an `AudioLoopPort`.
 * 2. **Note Progression**: Automatically advancing through the score as notes are matched.
 * 3. **Adaptive Difficulty**: Dynamically adjusting intonation and hold thresholds.
 * 4. **State Management**: Maintaining the reactive `EngineState` through a reducer.
 *
 * It operates as an asynchronous loop that yields `PracticeEngineEvent` objects,
 * allowing the UI to react to musical milestones in real-time.
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
  let state = getInitialEngineState(ctx.exercise, ctx.initialNoteIndex, ctx.loopRegion)

  const core = {
    getState: () => state,
    updateState: (e: PracticeEngineEvent) => {
      state = reducer(state, e)
    },
    getOptions: () => getEngineOptions({ ...ctx, centsTolerance: undefined }, state.perfectNoteStreak),
    isRunning: () => isRunning,
    setRunning: (val: boolean) => {
      isRunning = val
    },
  }

  return core
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

function getInitialEngineState(
  exercise: Exercise,
  initialNoteIndex = 0,
  loopRegion?: import('@/lib/domain/practice').LoopRegion,
): EngineState {
  const noteCount = exercise.notes.length
  let startIndex = initialNoteIndex

  if (loopRegion?.isEnabled) {
    startIndex = Math.max(startIndex, loopRegion.startNoteIndex)
  }

  const initialState: EngineState = {
    ...INITIAL_ENGINE_STATE,
    scoreLength: noteCount,
    currentNoteIndex: startIndex,
  }

  const result = initialState
  return result
}

/**
 * Builds the pipeline options for the engine iteration.
 * @internal
 */
function getEngineOptions(ctx: PracticeEngineContext, perfectNoteStreak = 0): NoteStreamOptions {
  const difficulty = calculateAdaptiveDifficulty(perfectNoteStreak)
  const indicatedBpm = ctx.exercise.indicatedBpm ?? 60
  const currentBpm = ctx.bpm ?? indicatedBpm

  // PRD: Scale requiredHoldTime proportionally to the tempo
  // If BPM is higher, requiredHoldTime should be lower.
  const tempoMultiplier = currentBpm / indicatedBpm
  const scaledHoldTime = difficulty.requiredHoldTime * (1 / tempoMultiplier)

  const options: NoteStreamOptions = {
    exercise: ctx.exercise,
    bpm: currentBpm,
    centsTolerance: ctx.centsTolerance ?? difficulty.centsTolerance,
    requiredHoldTime: scaledHoldTime,
    minRms: ctx.minRms ?? 0.01,
    minConfidence: 0.8, // Slightly more lenient to account for weak signals
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
/** @internal */
export function calculateAdaptiveDifficulty(perfectNoteStreak: number) {
  const streak = perfectNoteStreak
  const toleranceBase = 25
  const centsTolerance = Math.max(15, toleranceBase - Math.floor(streak / 3) * 5)
  const holdBase = 180
  const requiredHoldTime = Math.min(800, holdBase + Math.floor(streak / 5) * 100)

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
  const { ctx, getState, updateState, getOptions, signal } = params
  const options = { audioLoop: ctx.audio, detector: ctx.pitch, signal }
  const stream = createRawPitchStream(options)
  const startTime = Date.now()

  const analysis = initializeAnalysisWindow(getOptions)
  const isLooping = ctx.loopRegion?.isEnabled

  let attemptResults: number[] = []

  for await (const raw of stream) {
    if (signal.aborted) break

    const state = getState()
    const currentIndex = state.currentNoteIndex
    const loopEndIndex = ctx.loopRegion?.endNoteIndex ?? state.scoreLength - 1

    // Check if we reached the end of the loop or exercise
    const isExerciseFinished = currentIndex >= state.scoreLength
    const isLoopFinished = isLooping && currentIndex > loopEndIndex

    if (isExerciseFinished || isLoopFinished) {
      if (isLooping) {
        // Calculate precision for this attempt
        const precision = calculateAttemptPrecision(attemptResults)
        const success = ctx.loopRegion?.drillTarget
          ? precision >= ctx.loopRegion.drillTarget.precisionGoal
          : true

        yield* handleDrillAttempt(params, success, precision)
        attemptResults = []

        // If goal met N times, stop looping
        const currentStreak = getState().drillStreak
        const goalStreak = ctx.loopRegion?.drillTarget?.consecutiveRequired ?? 1

        if (ctx.loopRegion?.drillTarget && currentStreak >= goalStreak) {
          yield* finalizeSession(updateState)
          break
        }

        yield* handleLoopRestart(params)
      } else {
        yield* finalizeSession(updateState)
        break
      }
    }

    // Process current frame
    const freshState = getState()
    const targetNote = ctx.exercise.notes[freshState.currentNoteIndex] as TargetNote
    if (!targetNote) {
      yield* finalizeSession(updateState)
      break
    }

    const context = {
      targetNote,
      currentIndex: freshState.currentNoteIndex,
      sessionStartTime: startTime,
    }

    const currentOptions = resolveOptions(getOptions)
    const pipelineEvents = processRawPitchEvent({ ...analysis, raw, context, options: currentOptions })

    for (const event of pipelineEvents) {
      const engineEvent = mapPipelineEventToEngineEvent(event)
      if (engineEvent) {
        updateState(engineEvent)
        yield engineEvent
        if (engineEvent.type === 'NOTE_MATCHED') {
          attemptResults.push(engineEvent.payload.technique.pitchStability.inTuneRatio)
        }
      }
    }
  }
}

function calculateAttemptPrecision(results: number[]): number {
  if (results.length === 0) return 0
  const sum = results.reduce((a, b) => a + b, 0)
  return sum / results.length
}

async function* handleDrillAttempt(
  params: EngineRunnerParams,
  success: boolean,
  precision: number
): AsyncGenerator<PracticeEngineEvent> {
  const { updateState } = params
  const event: PracticeEngineEvent = {
    type: 'DRILL_ATTEMPT_COMPLETED',
    payload: { success, precision }
  }
  updateState(event)
  yield event
}

async function* handleLoopRestart(params: EngineRunnerParams): AsyncGenerator<PracticeEngineEvent> {
  const { ctx, updateState } = params
  const startIndex = ctx.loopRegion?.startNoteIndex ?? 0
  const restartEvent: PracticeEngineEvent = {
    type: 'JUMP_TO_INDEX',
    payload: { index: startIndex },
  }
  updateState(restartEvent)
  yield restartEvent
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

/** @internal */
export function mapMatchedEvent(payload: {
  technique?: NoteTechnique
  observations?: Observation[]
  isPerfect?: boolean
}): PracticeEngineEvent {
  if (!payload.technique) {
    throw new AppError({
      code: ERROR_CODES.TECHNIQUE_MISSING,
      message: 'NOTE_MATCHED event is missing technique analysis payload',
    })
  }

  const technique = payload.technique
  const observations = payload.observations ?? []
  const isPerfect = payload.isPerfect ?? false

  const matched: PracticeEngineEvent = {
    type: 'NOTE_MATCHED',
    payload: { technique, observations, isPerfect },
  }
  return matched
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

  const result = isComplete || isNewNote
  return result
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
