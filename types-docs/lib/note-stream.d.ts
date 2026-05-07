/**
 * NoteStream Pipeline
 *
 * This module creates a declarative, asynchronous pipeline using native async generators
 * to transform raw audio data into high-level musical practice events.
 *
 * @remarks
 * **Data Flow Architecture**:
 * 1. **Capture**: `createRawPitchStream` pulls PCM buffers from the `AudioLoopPort`.
 * 2. **Detection**: Each buffer is processed by `PitchDetectionPort` (YIN) into a `RawPitchEvent`.
 * 3. **Segmentation**: `NoteSegmenter` identifies note boundaries (Onset/Offset).
 * 4. **Analysis**: `TechniqueAnalysisAgent` evaluates the quality of each completed segment.
 * 5. **Output**: The pipeline yields `PracticeEvent` objects (e.g., `NOTE_MATCHED`).
 *
 * This decoupling allows the application logic to remain agnostic of the high-frequency
 * audio loop and the specific pitch detection algorithm used.
 */
import { type PracticeEvent, type TargetNote } from '@/lib/domain/practice';
import { AudioLoopPort, PitchDetectionPort } from './ports/audio.port';
import { NoteSegmenter } from './note-segmenter';
import { TechniqueAnalysisAgent } from './technique-analysis-agent';
import { TechniqueFrame, NoteSegment, PitchedFrame } from './technique-types';
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
    /** Whether the frame was normalized due to weak signal. */
    isNormalized?: boolean;
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
/**
 * Async generator that performs note stability validation and technical analysis.
 *
 * @remarks
 * Consumes pitch events from the upstream async iterable and emits higher-level
 * practice events once stability and analysis criteria are met. It maintains a
 * short-term memory of recent pitch frames to perform segment completion analysis
 * and rhythm tracking.
 *
 * @internal
 */
interface TechnicalAnalysisState {
    lastGapFrames: ReadonlyArray<TechniqueFrame>;
    firstNoteOnsetTime: number | undefined;
    prevSegment: NoteSegment | undefined;
    currentSegmentStart: number | undefined;
    cumulativeStartTimes: number[] | undefined;
    cachedBpm?: number;
}
/** @internal */
export declare function initializeAnalysisWindow(optionsOrGetter: NoteStreamOptions | (() => NoteStreamOptions)): {
    segmenter: NoteSegmenter;
    agent: TechniqueAnalysisAgent;
    state: TechnicalAnalysisState;
};
/** @internal */
export declare function resolveOptions(options: NoteStreamOptions | (() => NoteStreamOptions)): NoteStreamOptions;
/**
 * Processes a single raw pitch event and yields any resulting practice events.
 * @internal
 */
export declare function processRawPitchEvent(params: {
    raw: RawPitchEvent;
    state: TechnicalAnalysisState;
    segmenter: NoteSegmenter;
    agent: TechniqueAnalysisAgent;
    context: PipelineContext;
    options: NoteStreamOptions;
}): Generator<PracticeEvent>;
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
 * Uses an immutable context object to reduce accidental context drift across
 * async iteration steps. This mitigates accidental mutation between pipeline
 * stages, but concurrent pipelines should still be validated with dedicated
 * runtime tests.
 */
export declare function createPracticeEventPipeline(params: {
    rawPitchStream: AsyncIterable<RawPitchEvent>;
    context: PipelineContext;
    options: (Partial<NoteStreamOptions> & {
        exercise: Exercise;
    }) | (() => NoteStreamOptions);
    signal: AbortSignal;
}): AsyncIterable<PracticeEvent>;
export {};
