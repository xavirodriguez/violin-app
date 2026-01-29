/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 */
import { NoteTechnique, Observation } from './technique-types';
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types';
export type { TargetNote };
/**
 * A valid note name in scientific pitch notation.
 *
 * @example "C4", "F#5", "Bb3"
 *
 * @remarks
 * Pattern: `^[A-G][#b]?(?:[0-8])$`
 */
export type NoteName = string & {
    readonly __brand: unique symbol;
};
/**
 * Type guard to validate note name format.
 *
 * @param name - The string to validate.
 * @throws Error - if the format is invalid.
 */
export declare function assertValidNoteName(name: string): asserts name is NoteName;
/**
 * Represents a musical note with properties derived from its frequency.
 * @remarks
 * The factory methods (`fromFrequency`, `fromMidi`, `fromName`) are strict and will
 * throw errors on invalid input, such as non-finite numbers or malformed note names.
 * This is intentional to catch data or programming errors early.
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
    /**
     * Parses a note name in scientific pitch notation.
     *
     * @param fullName - A valid note name (e.g., "C4", "F#5", "Bb3")
     * @returns A MusicalNote instance
     * @throws Error - if format is invalid
     *
     * @example
     * MusicalNote.fromName("C#4" as NoteName); // ✅ OK
     * MusicalNote.fromName("H9" as NoteName);  // ❌ Throws Error
     */
    static fromName(fullName: NoteName): MusicalNote;
    get nameWithOctave(): NoteName;
}
/**
 * Defines the tolerance boundaries for matching a note.
 * Uses different values for entering and exiting the matched state
 * to prevent oscillation (hysteresis).
 */
export interface MatchHysteresis {
    /** Tolerance in cents to consider a note as "starting to match". */
    enter: number;
    /** Tolerance in cents to consider a note as "no longer matching". */
    exit: number;
}
/** Represents a note detected from the user's microphone input. */
export interface DetectedNote {
    pitch: string;
    cents: number;
    timestamp: number;
    confidence: number;
}
/** The status of the practice session. */
export type PracticeStatus = 'idle' | 'listening' | 'validating' | 'correct' | 'completed';
/** The complete, self-contained state of the practice session. */
export interface PracticeState {
    status: PracticeStatus;
    exercise: Exercise;
    currentIndex: number;
    detectionHistory: readonly DetectedNote[];
    holdDuration?: number;
    lastObservations?: Observation[];
}
/** Events that can modify the practice state. */
export type PracticeEvent = {
    type: 'START';
} | {
    type: 'STOP';
} | {
    type: 'RESET';
} | {
    type: 'NOTE_DETECTED';
    payload: DetectedNote;
} | {
    type: 'HOLDING_NOTE';
    payload: {
        duration: number;
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
export declare function formatPitchName(pitch: TargetNote['pitch']): NoteName;
/**
 * Checks if a detected note matches a target note within a specified tolerance.
 * Supports hysteresis to prevent rapid toggling near the tolerance boundary.
 *
 * @param target - The expected musical note.
 * @param detected - The note detected from audio.
 * @param tolerance - Either a fixed cent tolerance or a `MatchHysteresis` object.
 * @param isCurrentlyMatched - Whether the note was already matching in the previous frame.
 * @returns True if the detected note is considered a match.
 */
export declare function isMatch(target: TargetNote, detected: DetectedNote, tolerance?: number | MatchHysteresis, isCurrentlyMatched?: boolean): boolean;
/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export declare function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState;
