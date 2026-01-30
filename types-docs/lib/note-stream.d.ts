/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */
import { type PracticeEvent, type TargetNote } from '@/lib/practice-core';
import type { PitchDetector } from '@/lib/pitch-detector';
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
    readonly targetNote: () => TargetNote | null;
    readonly getCurrentIndex: () => number;
}
/**
 * Creates an async iterable of raw pitch events from a Web Audio API AnalyserNode.
 */
export declare function createRawPitchStream(analyser: AnalyserNode, detector: PitchDetector, signal: AbortSignal): AsyncGenerator<RawPitchEvent>;
/**
 * Constructs the final practice event pipeline by connecting the raw pitch stream
 * to the technical analysis and note stability window.
 *
 * @remarks
 * This function serves as the main factory for creating a fully configured practice event stream.
 * It encapsulates the complexity of the underlying `iter-tools` pipeline and provides a simple
 * interface for the consumer.
 *
 * @param rawPitchStream - The source `AsyncIterable` of raw pitch events, typically from `createRawPitchStream`.
 * @param targetNote - A selector function that returns the current `TargetNote` to match against.
 * @param getCurrentIndex - A selector function to get the current note's index for rhythm analysis.
 * @param options - Optional configuration overrides for the pipeline.
 * @returns An `AsyncIterable` that yields `PracticeEvent` objects.
 */
export declare function createPracticeEventPipeline(rawPitchStream: AsyncIterable<RawPitchEvent>, targetNote: () => TargetNote | null, getCurrentIndex: () => number, options: Partial<NoteStreamOptions> & {
    exercise: Exercise;
    sessionStartTime: number;
}, signal: AbortSignal): AsyncIterable<PracticeEvent>;
