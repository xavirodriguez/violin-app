import { NoteTechnique, Observation } from '../technique-types'
import { TargetNote, DetectedNote } from '../practice-core'
import { RawPitchEvent } from '../note-stream'

export type { NoteTechnique, Observation, TargetNote, RawPitchEvent, DetectedNote }

/**
 * Valid statuses for the internal practice engine.
 */
export type PracticeEngineStatus = 'idle' | 'ready' | 'active' | 'completed'

/**
 * Payload for the NOTE_DETECTED event.
 */
export type NoteDetectedPayload = DetectedNote

/**
 * Payload for the HOLDING_NOTE event.
 */
export interface HoldingNotePayload {
  duration: number
}

/**
 * Payload for the NOTE_MATCHED event.
 */
export interface NoteMatchedPayload {
  technique: NoteTechnique
  observations: Observation[]
  isPerfect: boolean
}

/**
 * Discriminated union of all possible events emitted by the PracticeEngine.
 *
 * @public
 */
export type PracticeEngineEvent =
  | { type: 'NOTE_DETECTED'; payload: NoteDetectedPayload }
  | { type: 'HOLDING_NOTE'; payload: HoldingNotePayload }
  | { type: 'NOTE_MATCHED'; payload: NoteMatchedPayload }
  | { type: 'NO_NOTE' }
  | { type: 'SESSION_COMPLETED' }

/**
 * Represents a note that has been fully processed and analyzed by the engine.
 */
export interface CompletedNote {
  index: number
  technique: NoteTechnique
  observations: Observation[]
}
