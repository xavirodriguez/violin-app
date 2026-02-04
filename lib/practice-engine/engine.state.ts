import { PracticeEngineStatus, Observation, NoteTechnique } from './engine.types'

export interface PracticeEngineState {
  status: PracticeEngineStatus
  currentNoteIndex: number
  scoreLength: number
  liveObservations: Observation[]
  lastTechnique?: NoteTechnique
  perfectNoteStreak: number
}

export const INITIAL_ENGINE_STATE: PracticeEngineState = {
  status: 'idle',
  currentNoteIndex: 0,
  scoreLength: 0,
  liveObservations: [],
  perfectNoteStreak: 0,
}
