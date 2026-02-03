import { PracticeEngineState } from './engine.state'
import { PracticeEngineEvent } from './engine.types'

export type PracticeReducer = (
  state: PracticeEngineState,
  event: PracticeEngineEvent
) => PracticeEngineState

export const engineReducer: PracticeReducer = (state, event) => {
  switch (event.type) {
    case 'NOTE_DETECTED':
      return { ...state, status: 'active' }
    case 'HOLDING_NOTE':
      return { ...state, status: 'active' }
    case 'NOTE_MATCHED':
      return {
        ...state,
        currentNoteIndex: state.currentNoteIndex + 1,
        lastTechnique: event.payload?.technique,
        liveObservations: [],
      }
    case 'SESSION_COMPLETED':
      return { ...state, status: 'completed' }
    case 'NO_NOTE':
      return { ...state }
    default:
      return state
  }
}
