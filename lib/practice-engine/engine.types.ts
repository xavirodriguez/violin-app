import { NoteTechnique, Observation } from '../technique-types'
import { TargetNote } from '../practice-core'
import { RawPitchEvent } from '../note-stream'

export type { NoteTechnique, Observation, TargetNote, RawPitchEvent }

export type PracticeEngineStatus = 'idle' | 'ready' | 'active' | 'completed'

export interface PracticeEngineEvent {
  type: 'NOTE_DETECTED' | 'HOLDING_NOTE' | 'NOTE_MATCHED' | 'NO_NOTE' | 'SESSION_COMPLETED'
  payload?: any
}

export interface CompletedNote {
  index: number
  technique: NoteTechnique
  observations: Observation[]
}
