/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */
import { type PracticeEvent, type TargetNote } from '@/lib/practice-core';
import { AudioLoopPort, PitchDetectionPort } from './ports/audio.port';
import { NoteSegment, PitchedFrame } from './technique-types';
import type { Exercise } from './exercises/types';
/**
 * The raw data yielded from the pitch detector on each animation frame.
 */
export interface RawPitchEvent {
    /** The detected fundamental frequency in Hertz. */
    pitchHz: number;
    /** The pitch detector's confidence in the result (0-1). */
    confidence: number;
    /** The Root Mean Square (volume) of the audio buffer. */
    rms: number;
    /** The timestamp when the event was generated. */
    timestamp: number;
}
/**
 * Configuration options for the note stream pipeline.
 */
export interface NoteStreamOptions {
    /** The minimum RMS (volume) to consider as a valid signal. */
    minRms: number;
    /** The minimum confidence score from the pitch detector to trust the result. */
    minConfidence: number;
    /** The allowable pitch deviation in cents for a note to be considered a match. */
    centsTolerance: number;
    /** The duration in milliseconds a note must be held to be considered "matched". */
    requiredHoldTime: number;
    /** The full exercise object, used for rhythm analysis. */
    exercise?: Exercise;
    /** The start time of the session, used as a reference for rhythm calculations. */
    sessionStartTime?: number;
    /** The beats per minute (BPM) of the exercise, for rhythm analysis. */
    bpm: number;
}
/**
 * Immutable snapshot of pipeline context.
 * Captured once at pipeline creation to prevent state drift.
 */
export interface PipelineContext {
    readonly targetNote: TargetNote | undefined;
    readonly currentIndex: number;
    readonly sessionStartTime: number;
}
/** @internal */
export declare const DEFAULT_NOTE_STREAM_OPTIONS: NoteStreamOptions;
/**
 * Creates an async iterable of raw pitch events using audio ports.
 */
export declare function createRawPitchStream(params: {
    audioLoop: AudioLoopPort;
    detector: PitchDetectionPort;
    signal: AbortSignal;
}): AsyncGenerator<RawPitchEvent>;
export declare function isValidMatch(params: {
    target: TargetNote;
    segment: NoteSegment;
    pitchedFrames: PitchedFrame[];
    options: NoteStreamOptions;
}): boolean;
/**
 * Creates a practice event processing pipeline with immutable context.
 *
 * @param params - Configuration parameters for the pipeline.
 * @returns An `AsyncIterable` that yields `PracticeEvent` objects.
 *
 * @remarks
 * This design prevents context drift during async iteration.
 * When the exercise note changes, create a new pipeline.
 */
export declare function createPracticeEventPipeline(params: {
    rawPitchStream: AsyncIterable<RawPitchEvent>;
    context: PipelineContext;
    options: (Partial<NoteStreamOptions> & {
        exercise: Exercise;
    }) | (() => NoteStreamOptions);
    signal: AbortSignal;
}): AsyncIterable<PracticeEvent>;
