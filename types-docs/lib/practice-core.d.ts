/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 */
import type { Exercise } from '@/lib/exercises/types';
import { NoteTechnique, Observation } from './technique-types';
export type { Note as TargetNote } from '@/lib/exercises/types';
/**
 * Represents a musical note with properties derived from its frequency.
 */
export declare class MusicalNote {
    readonly frequency: number;
    readonly midiNumber: number;
    readonly noteName: string;
    readonly octave: number;
    readonly centsDeviation: number;
    private constructor();
    isEnharmonic(other: MusicalNote): boolean;
    static fromFrequency(frequency: number): MusicalNote;
    static fromMidi(midiNumber: number): MusicalNote;
    static fromName(fullName: string): MusicalNote;
    get nameWithOctave(): string;
}
/** Represents a note detected from the user's microphone input. */
export interface DetectedNote {
    pitch: string;
    cents: number;
    timestamp: number;
    confidence: number;
}
/** The status of the practice session. */
export type PracticeStatus = 'idle' | 'listening' | 'completed';
/** The complete, self-contained state of the practice session. */
export interface PracticeState {
    status: PracticeStatus;
    exercise: Exercise;
    currentIndex: number;
    detectionHistory: DetectedNote[];
    lastObservations?: Observation[];
    holdDuration: number;
    requiredHoldTime: number;
}
/** Events that can modify the practice state. */
export type PracticeEvent = {
    type: 'START';
    payload: {
        requiredHoldTime: number;
    };
} | {
    type: 'STOP';
} | {
    type: 'RESET';
} | {
    type: 'NOTE_DETECTED';
    payload: DetectedNote;
} | {
    type: 'NOTE_HOLD_PROGRESS';
    payload: {
        holdDuration: number;
    };
} | {
    type: 'NOTE_MATCHED';
    payload?: {
        technique: NoteTechnique;
        observations?: Observation[];
    };
} | {
    type: 'NO_NOTE_DETECTED';
};
/**
 * Converts a `TargetNote`'s pitch into a standard, parsable note name string.
 *
 * @remarks
 * This function handles various `alter` formats, including numeric (`1`, `-1`) and
 * string-based (`"sharp"`, `"#"`), normalizing them into a format that `MusicalNote`
 * can parse (e.g., "C#4"). It will throw an error if the `alter` value is
 * unsupported, as this indicates a data validation issue upstream.
 *
 * @param pitch - The pitch object from a `TargetNote`.
 * @returns A standardized note name string like `"C#4"` or `"Bb3"`.
 */
export declare function formatPitchName(pitch: TargetNote['pitch']): string;
/**
 * Checks if a detected note matches a target note within a specified tolerance.
 */
export declare function isMatch(target: TargetNote, detected: DetectedNote, centsTolerance?: number): boolean;
/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export declare function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState;
