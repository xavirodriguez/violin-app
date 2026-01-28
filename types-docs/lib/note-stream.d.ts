/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */
import { type PracticeEvent, type TargetNote } from '@/lib/practice-core';
import type { PitchDetector } from '@/lib/pitch-detector';
import type { Exercise } from './exercises/types';
/** The raw data coming from the pitch detector on each animation frame. */
export interface RawPitchEvent {
    pitchHz: number;
    confidence: number;
    rms: number;
    timestamp: number;
}
/** Configuration options for the note stream pipeline. */
export interface NoteStreamOptions {
    minRms: number;
    minConfidence: number;
    centsTolerance: number;
    requiredHoldTime: number;
    exercise?: Exercise;
    sessionStartTime?: number;
    bpm: number;
}
/**
 * Creates an async iterable of raw pitch events from a Web Audio API AnalyserNode.
 *
 * @remarks
 * This function is the entry point for the audio processing pipeline. It runs a
 * continuous loop using `requestAnimationFrame` to capture audio data, process it
 * with the provided pitch detector, and yield the raw results. The loop's
 * lifecycle is controlled by the `isActive` callback, which must be implemented
 * by the caller to signal when the stream should terminate.
 *
 * @param analyser - The configured `AnalyserNode` from which to pull audio time-domain data.
 * @param detector - An instance of `PitchDetector` used to find the fundamental frequency.
 * @param isActive - A function that returns `false` to gracefully terminate the async generator loop.
 * @returns An `AsyncGenerator` that yields `RawPitchEvent` objects on each animation frame.
 */
export declare function createRawPitchStream(analyser: AnalyserNode, detector: PitchDetector, isActive: () => boolean): AsyncGenerator<RawPitchEvent>;
/**
 * Constructs the final practice event pipeline by chaining together signal processing steps.
 */
export declare function createPracticeEventPipeline(rawPitchStream: AsyncIterable<RawPitchEvent>, targetNote: () => TargetNote | null, getCurrentIndex: () => number, options?: Partial<NoteStreamOptions>): AsyncIterable<PracticeEvent>;
