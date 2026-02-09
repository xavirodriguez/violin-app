import { PracticeEngineEvent } from './engine.types'
import { AudioFramePort, PitchDetectorPort } from './engine.ports'
import { createRawPitchStream, createPracticeEventPipeline } from '../note-stream'
import { Exercise } from '../exercises/types'
import { featureFlags } from '../feature-flags'
import { PracticeEngineState, INITIAL_ENGINE_STATE } from './engine.state'
import { PracticeReducer, engineReducer } from './engine.reducer'

export interface PracticeEngineContext {
  audio: AudioFramePort
  pitch: PitchDetectorPort
  exercise: Exercise
  reducer?: PracticeReducer
}

export interface PracticeEngine {
  start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent>
  stop(): void
  getState(): PracticeEngineState
}

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
