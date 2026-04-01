import { EngineState } from './engine.state'
import { PracticeEngineEvent, EngineStatus } from './engine.types'

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
  NOTE_DETECTED: (state) => {
    const activeStatus: EngineStatus = 'active'
    const nextState = { ...state, status: activeStatus }
    const result = nextState

    return result
  },
  HOLDING_NOTE: (state) => {
    const activeStatus: EngineStatus = 'active'
    const nextState = { ...state, status: activeStatus }
    const result = nextState

    return result
  },
  NOTE_MATCHED: (state, event) => {
    const typedEvent = event as Extract<PracticeEngineEvent, { type: 'NOTE_MATCHED' }>
    const { technique, isPerfect } = typedEvent.payload
    const nextIndex = state.currentNoteIndex + 1
    const nextStreak = isPerfect ? state.perfectNoteStreak + 1 : 0

    return {
      ...state,
      currentNoteIndex: nextIndex,
      lastTechnique: technique,
      liveObservations: [],
      perfectNoteStreak: nextStreak,
    }
  },
  SESSION_COMPLETED: (state) => {
    const completedStatus: EngineStatus = 'completed'
    const nextState = { ...state, status: completedStatus }
    const result = nextState

    return result
  },
  NO_NOTE: (state) => {
    const currentState = state
    const result = currentState

    return result
  },
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
