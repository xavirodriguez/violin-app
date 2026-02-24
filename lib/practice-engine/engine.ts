import { PracticeEngineEvent } from './engine.types'
import { AudioFramePort, PitchDetectorPort } from './engine.ports'
import {
  createRawPitchStream,
  createPracticeEventPipeline,
  NoteStreamOptions,
} from '../note-stream'
import { Exercise } from '../exercises/types'
import { PracticeEngineState, INITIAL_ENGINE_STATE } from './engine.state'
import { PracticeReducer, engineReducer } from './engine.reducer'
import { PracticeEvent } from '../practice-core'
import { AudioLoopPort, PitchDetectionPort as AudioPitchPort } from '../ports/audio.port'

/**
 * Configuration context for the {@link PracticeEngine}.
 *
 * @public
 */
export interface PracticeEngineContext {
  /** Source of raw audio frames. */
  audio: AudioFramePort
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
  getState(): PracticeEngineState
}

/**
 * Calculates adaptive difficulty parameters based on performance history.
 */
function calculateAdaptiveDifficulty(perfectNoteStreak: number) {
  const centsTolerance = Math.max(10, 25 - Math.floor(perfectNoteStreak / 3) * 5)
  const requiredHoldTime = Math.min(800, 500 + Math.floor(perfectNoteStreak / 5) * 100)
  return { centsTolerance, requiredHoldTime }
}

/**
 * Maps a low-level practice event to a high-level engine event.
 */
function mapPipelineEventToEngineEvent(event: PracticeEvent): PracticeEngineEvent | null {
  switch (event.type) {
    case 'NOTE_DETECTED':
    case 'HOLDING_NOTE':
      return { type: event.type, payload: event.payload }
    case 'NOTE_MATCHED':
      return {
        type: 'NOTE_MATCHED',
        payload: {
          technique: event.payload.technique,
          observations: event.payload.observations ?? [],
          isPerfect: event.payload.isPerfect ?? false,
        },
      }
    case 'NO_NOTE_DETECTED':
      return { type: 'NO_NOTE' }
    default:
      return null
  }
}

/**
 * Factory function to create a new {@link PracticeEngine} instance.
 *
 * @public
 */
export function createPracticeEngine(ctx: PracticeEngineContext): PracticeEngine {
  let isRunning = false
  const reducer = ctx.reducer ?? engineReducer
  let state: PracticeEngineState = {
    ...INITIAL_ENGINE_STATE,
    scoreLength: ctx.exercise.notes.length,
  }

  const getOptions = (): NoteStreamOptions => {
    const { centsTolerance, requiredHoldTime } = calculateAdaptiveDifficulty(state.perfectNoteStreak)
    return {
      exercise: ctx.exercise,
      bpm: 60,
      centsTolerance,
      requiredHoldTime,
      minRms: 0.01,
      minConfidence: 0.85,
    }
  }

  return {
    async *start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent> {
      if (isRunning) return
      isRunning = true
      const audioPort = ctx.audio as unknown as AudioLoopPort
      const pitchPort = ctx.pitch as unknown as AudioPitchPort
      const rawPitchStream = createRawPitchStream(audioPort, pitchPort, signal)
      const sessionStartTime = Date.now()

      try {
        while (state.currentNoteIndex < state.scoreLength && !signal.aborted) {
          const noteIndex = state.currentNoteIndex
          const pipeline = createPracticeEventPipeline(
            rawPitchStream,
            { targetNote: ctx.exercise.notes[noteIndex] ?? null, currentIndex: noteIndex, sessionStartTime },
            getOptions,
            signal,
          )

          for await (const event of pipeline) {
            if (signal.aborted) break
            const engineEvent = mapPipelineEventToEngineEvent(event)
            if (!engineEvent) continue

            state = reducer(state, engineEvent)
            yield engineEvent

            if (engineEvent.type === 'NOTE_MATCHED') {
              if (state.currentNoteIndex !== noteIndex) break
              if (state.currentNoteIndex >= state.scoreLength) {
                const complete: PracticeEngineEvent = { type: 'SESSION_COMPLETED' }
                state = reducer(state, complete)
                yield complete
                return
              }
            }
          }
        }
      } finally {
        isRunning = false
      }
    },
    stop() { isRunning = false },
    getState() { return state },
  }
}
