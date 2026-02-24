import { PracticeEngineState } from './engine.state'
import { PracticeEngineEvent } from './engine.types'

/**
 * Pure reducer function for the PracticeEngine state.
 *
 * @param state - Current engine state.
 * @param event - The event to process.
 * @returns The next engine state.
 * @public
 */
export type PracticeReducer = (
  state: PracticeEngineState,
  event: PracticeEngineEvent
) => PracticeEngineState

/**
 * Implementation of the engine state reducer.
 *
 * @remarks
 * Handles state transitions for musical practice milestones:
 * - `NOTE_DETECTED`/`HOLDING_NOTE`: Marks the engine as active.
 * - `NOTE_MATCHED`: Advances the note index and updates the streak.
 * - `SESSION_COMPLETED`: Finalizes the practice session.
 */
export const engineReducer: PracticeReducer = (state, event) => {
  switch (event.type) {
    case 'NOTE_DETECTED':
    case 'HOLDING_NOTE':
      return { ...state, status: 'active' }
    case 'NOTE_MATCHED':
      return {
        ...state,
        currentNoteIndex: state.currentNoteIndex + 1,
        lastTechnique: event.payload.technique,
        liveObservations: [],
        perfectNoteStreak: event.payload.isPerfect ? state.perfectNoteStreak + 1 : 0,
      }
    case 'SESSION_COMPLETED':
      return { ...state, status: 'completed' }
    case 'NO_NOTE':
    default:
      return state
  }
}
