import { PracticeEngineEvent } from './engine.types'
import { AudioFramePort, PitchDetectorPort } from './engine.ports'
import { createRawPitchStream, createPracticeEventPipeline } from '../note-stream'
import { Exercise } from '../exercises/types'
import { featureFlags } from '../feature-flags'
import { PracticeEngineState, INITIAL_ENGINE_STATE } from './engine.state'
import { PracticeReducer, engineReducer } from './engine.reducer'

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
 * @remarks
 * The engine is a stateful orchestrator that processes raw audio signals
 * into high-level musical events (e.g., "Note Matched").
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
 * Factory function to create a new {@link PracticeEngine} instance.
 *
 * @remarks
 * **Implementation Details**:
 * The engine uses a "Pipeline Re-creation" strategy. Whenever a note is
 * successfully matched, it breaks the inner loop to re-create the
 * `createPracticeEventPipeline` with the next target note. This ensures
 * that pedagogical constraints (like required hold time) are accurately
 * applied to each note in the sequence.
 *
 * **Adaptive Difficulty**:
 * It dynamically calculates `centsTolerance` and `requiredHoldTime` based
 * on the user's `perfectNoteStreak`.
 *
 * @param ctx - The initialization context.
 * @returns A stateful {@link PracticeEngine} instance.
 *
 * @public
 */
export function createPracticeEngine(ctx: PracticeEngineContext): PracticeEngine {
  let isRunning = false
  const reducer = ctx.reducer ?? engineReducer
  let state: PracticeEngineState = {
    ...INITIAL_ENGINE_STATE,
    scoreLength: ctx.exercise.notes.length
  }

  return {
    async *start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent> {
      if (isRunning) return
      isRunning = true

      const rawPitchStream = createRawPitchStream(
        ctx.audio as any,
        ctx.pitch as any,
        signal
      )

      const sessionStartTime = Date.now()

      try {
        while (state.currentNoteIndex < state.scoreLength && !signal.aborted) {
          const currentNoteIndex = state.currentNoteIndex
          const pipeline = createPracticeEventPipeline(
            rawPitchStream,
            {
              targetNote: ctx.exercise.notes[currentNoteIndex] ?? null,
              currentIndex: currentNoteIndex,
              sessionStartTime,
            },
            () => {
              // Adaptive Difficulty (Permanent): Adjust both tolerance and hold time based on performance
              const centsTolerance = Math.max(10, 25 - Math.floor(state.perfectNoteStreak / 3) * 5)
              const requiredHoldTime = Math.min(800, 500 + Math.floor(state.perfectNoteStreak / 5) * 100)

              return {
                exercise: ctx.exercise,
                bpm: 60,
                centsTolerance,
                requiredHoldTime
              } as any
            },
            signal
          )

          for await (const event of pipeline) {
            if (signal.aborted) break

            let engineEvent: PracticeEngineEvent | null = null

          // Map pipeline events to Engine events
          if (event.type === 'NOTE_DETECTED') {
            engineEvent = { type: 'NOTE_DETECTED', payload: event.payload }
          } else if (event.type === 'HOLDING_NOTE') {
            engineEvent = { type: 'HOLDING_NOTE', payload: event.payload }
          } else if (event.type === 'NOTE_MATCHED') {
            engineEvent = { type: 'NOTE_MATCHED', payload: event.payload }
          } else if (event.type === 'NO_NOTE_DETECTED') {
            engineEvent = { type: 'NO_NOTE' }
          }

            if (engineEvent) {
              state = reducer(state, engineEvent)
              yield engineEvent

              if (engineEvent.type === 'NOTE_MATCHED') {
                // If the note changed, we need a new pipeline snapshot
                if (state.currentNoteIndex !== currentNoteIndex) {
                  break // Exit inner loop to recreate pipeline
                }

                if (state.currentNoteIndex >= state.scoreLength) {
                  const completionEvent: PracticeEngineEvent = { type: 'SESSION_COMPLETED' }
                  state = reducer(state, completionEvent)
                  yield completionEvent
                  return // End the generator
                }
              }
            }
          }
        }
      } finally {
        isRunning = false
      }
    },

    stop() {
      isRunning = false
    },

    getState() {
      return state
    }
  }
}
