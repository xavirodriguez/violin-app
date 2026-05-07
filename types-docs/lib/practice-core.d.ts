/**
 * This file contains the pure, side-effect-free core logic for the violin practice mode.
 * It defines the state, events, and a reducer function to handle state transitions in an immutable way.
 * This core is decoupled from React, Zustand, OSMD, and any browser-specific APIs.
 * Refactored for branded types and strict validation.
 */
import type { Note as TargetNote } from '@/lib/domain/exercise';
import type { DetectedNote, PracticeStatus, PracticeState, PracticeEvent, MatchHysteresis, LoopRegion } from '@/lib/domain/practice';
export type { TargetNote, DetectedNote, PracticeStatus, PracticeState, PracticeEvent, MatchHysteresis, LoopRegion, };
/**
 * A valid note name in scientific pitch notation.
 *
 * @example "C4", "F#5", "Bb3"
 * @remarks Pattern: `^[A-G][#b]?[0-8]$`
 */
export type NoteName = string & {
    readonly __brand: unique symbol;
};
/**
 * Type guard to validate note name format.
 *
 * @param name - The string to validate.
 *
 * @remarks
 * Throws `AppError` with code `NOTE_PARSING_FAILED` if invalid.
 */
export declare function assertValidNoteName(name: string): asserts name is NoteName;
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
    /**
     * Parses a note name in scientific pitch notation.
     *
     * @param fullName - A valid note name (e.g., "C4", "F#5", "Bb3")
     * @returns A MusicalNote instance
     * @throws {@link AppError} with code `NOTE_PARSING_FAILED` if format is invalid
     */
    static fromName(fullName: NoteName): MusicalNote;
    get nameWithOctave(): NoteName;
}
/**
 * Converts a `TargetNote`'s pitch into a standard, parsable note name string.
 *
 * @param pitch - The pitch object from a `TargetNote`.
 * @returns A standardized branded note name string like `"C#4"`.
 */
export declare function formatPitchName(pitch: TargetNote['pitch']): NoteName;
/**
 * Checks if a detected note matches a target note within a specified tolerance.
 * Short-circuits if target or detected note is undefined.
 */
export declare function isMatch(params: {
    target: TargetNote | undefined;
    detected: DetectedNote | undefined;
    tolerance?: number | MatchHysteresis;
    matchStatus?: 'initial' | 'maintaining';
}): boolean;
/**
 * Entry point for entering the matched state.
 */
export declare function isNewMatch(params: {
    target: TargetNote | undefined;
    detected: DetectedNote | undefined;
    tolerance?: number | MatchHysteresis;
}): boolean;
/**
 * Entry point for maintaining the matched state.
 */
export declare function isStillMatched(params: {
    target: TargetNote | undefined;
    detected: DetectedNote | undefined;
    tolerance?: number | MatchHysteresis;
}): boolean;
/**
 * The core reducer for the practice mode, handling all state transitions.
 */
export declare function reducePracticeEvent(state: PracticeState, event: PracticeEvent): PracticeState;
