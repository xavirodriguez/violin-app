import { EngineState } from './engine.state'
import { PracticeEngineEvent } from './engine.types'

/**
 * Pure reducer function for the {@link PracticeEngine} state.
 *
 * @public
 */
export type PracticeReducer = (state: EngineState, event: PracticeEngineEvent) => EngineState

/**
 * Registry of state transition handlers for the {@link PracticeEngine}.
 * @internal
 */
const HANDLERS: Record<
  PracticeEngineEvent['type'],
  (state: EngineState, event: PracticeEngineEvent) => EngineState
> = {
  NOTE_DETECTED: (state) => ({ ...state, status: 'active' }),
  HOLDING_NOTE: (state) => ({ ...state, status: 'active' }),
  NOTE_MATCHED: (state, event) => ({
    ...state,
    currentNoteIndex: state.currentNoteIndex + 1,
    lastTechnique: event.payload.technique,
    liveObservations: [],
    perfectNoteStreak: event.payload.isPerfect ? state.perfectNoteStreak + 1 : 0,
  }),
  SESSION_COMPLETED: (state) => ({ ...state, status: 'completed' }),
  NO_NOTE: (state) => state,
}

/**
 * Reducer for the musical practice engine, handling transitions between states.
 *
 * @remarks
 * This implementation uses a record-based handler map to ensure the function
 * stays within the recommended line limit while being easily extensible.
 *
 * @param state - Current engine state.
 * @param event - The event to process.
 * @returns The next engine state.
 * @public
 */
export const engineReducer: PracticeReducer = (state, event) => {
  const handler = HANDLERS[event.type]
  return handler ? handler(state, event) : state
}
