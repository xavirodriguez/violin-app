import { NoteTechnique, Observation } from '../technique-types';
import { TargetNote, DetectedNote } from '../practice-core';
import { RawPitchEvent } from '../note-stream';
export type { NoteTechnique, Observation, TargetNote, RawPitchEvent, DetectedNote };
/**
 * Valid statuses for the internal practice engine.
 *
 * @public
 */
export type EngineStatus = 'idle' | 'ready' | 'active' | 'completed';
/**
 * Payload for the NOTE_DETECTED event.
 *
 * @public
 */
export type NoteDetectedPayload = DetectedNote;
/**
 * Payload for the HOLDING_NOTE event.
 *
 * @public
 */
export interface HoldingNotePayload {
    /** The total duration in milliseconds the note has been held. */
    duration: number;
}
/**
 * Payload for the NOTE_MATCHED event.
 *
 * @public
 */
export interface NoteMatchedPayload {
    /** Technical analysis of the matched note. */
    technique: NoteTechnique;
    /** Pedagogical observations generated from the analysis. */
    observations: Observation[];
    /** Whether the note met the 'perfect' threshold for streak counting. */
    isPerfect: boolean;
}
/**
 * Discriminated union of all possible events emitted by the PracticeEngine.
 *
 * @public
 */
export type PracticeEngineEvent = {
    type: 'NOTE_DETECTED';
    payload: NoteDetectedPayload;
} | {
    type: 'HOLDING_NOTE';
    payload: HoldingNotePayload;
} | {
    type: 'NOTE_MATCHED';
    payload: NoteMatchedPayload;
} | {
    type: 'NO_NOTE';
} | {
    type: 'SESSION_COMPLETED';
} | {
    type: 'JUMP_TO_INDEX';
    payload: {
        index: number;
    };
} | {
    type: 'DRILL_ATTEMPT_COMPLETED';
    payload: {
        success: boolean;
        precision: number;
    };
};
/**
 * Represents a note that has been fully processed and analyzed by the engine.
 *
 * @public
 */
export interface CompletedNote {
    /** The zero-based index of the note in the exercise. */
    index: number;
    /** The final technical metrics for this note. */
    technique: NoteTechnique;
    /** Any feedback observations for this note. */
    observations: Observation[];
}
