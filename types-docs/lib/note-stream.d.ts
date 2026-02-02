/**
 * This file creates a declarative pipeline using `iter-tools` to process raw
 * pitch detection events into a stream of well-defined `PracticeEvent`s.
 * This decouples the audio input source from the state management logic.
 */
import { type PracticeEvent, type TargetNote } from '@/lib/practice-core';
import { AudioLoopPort, PitchDetectionPort } from './ports/audio.port';
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
 * Creates an async iterable of raw pitch events using audio ports.
 */
export declare function createRawPitchStream(audioLoop: AudioLoopPort, detector: PitchDetectionPort, signal: AbortSignal): AsyncGenerator<RawPitchEvent>;
/**
 * Creates a practice event processing pipeline.
 *
 * @param rawPitchStream - Raw pitch detection events
 * @param targetNote - **Function called on EVERY event** to get current target.
 *   Must be idempotent for the same index. Use a store selector.
 * @param getCurrentIndex - **Function called on EVERY event** to get current position.
 *   Must be idempotent. Use a store selector.
 * @param options - Pipeline configuration
 * @param signal - AbortSignal to stop the pipeline
 * @returns An `AsyncIterable` that yields `PracticeEvent` objects.
 *
 * @remarks
 * **Critical**: `targetNote` and `getCurrentIndex` are called frequently (60+ fps).
 * Ensure they:
 * 1. Are fast (\< 1ms)
 * 2. Return consistent values for the same underlying state
 * 3. Use memoized selectors from Zustand stores
 *
 * @example
 * ```ts
 * const pipeline = createPracticeEventPipeline(
 *   rawStream,
 *   () => usePracticeStore.getState().targetNote,  // ✅ Store selector
 *   () => usePracticeStore.getState().currentNoteIndex,
 *   options,
 *   signal
 * );
 * ```
 */
export declare function createPracticeEventPipeline(rawPitchStream: AsyncIterable<RawPitchEvent>, targetNote: () => TargetNote | null, getCurrentIndex: () => number, options: Partial<NoteStreamOptions> & {
    exercise: Exercise;
    sessionStartTime: number;
}, signal: AbortSignal): AsyncIterable<PracticeEvent>;
