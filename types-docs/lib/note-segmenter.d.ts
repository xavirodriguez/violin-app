import { TechniqueFrame, MusicalNoteName, TimestampMs, NoteSegment } from './technique-types';
/**
 * Configuration options for the `NoteSegmenter`.
 */
export interface SegmenterOptions {
    /** The minimum RMS value to be considered a potential signal. */
    minRms: number;
    /** The maximum RMS value to be considered silence. */
    maxRmsSilence: number;
    /** The minimum confidence score from the pitch detector to trust the note name. */
    minConfidence: number;
    /** The duration in milliseconds a signal must be present to trigger an `ONSET` event. */
    onsetDebounceMs: number;
    /** The duration in milliseconds a signal must be absent to trigger an `OFFSET` event. */
    offsetDebounceMs: number;
    /** The duration in milliseconds a new pitch must be stable to trigger a `NOTE_CHANGE`. */
    noteChangeDebounceMs: number;
    /** The duration in milliseconds to tolerate pitch dropouts if RMS is still high. */
    pitchDropoutToleranceMs: number;
    /** The duration of silence that resets the noisy gap buffer. */
    noisyGapResetMs: number;
    /** Maximum number of frames to keep in the gap buffer. */
    maxGapFrames: number;
    /** Maximum number of frames to keep in the note buffer. */
    maxNoteFrames: number;
}
/**
 * Validates the provided options for the NoteSegmenter.
 * @throws Error if options are invalid or inconsistent.
 */
export declare function validateOptions(options: SegmenterOptions): void;
/**
 * Possible segmenter events emitted during note detection.
 *
 * @remarks
 * Event Sequence:
 * 1. ONSET: Sound begins -> new note detected
 * 2. NOTE_CHANGE: Pitch changes mid-sound (unusual, may indicate sliding)
 * 3. OFFSET: Sound ends -> note completed with full analysis
 */
export type SegmenterEvent = {
    type: 'ONSET';
    /** Timestamp when note attack was detected (ms) */
    timestamp: TimestampMs;
    /** The detected note name (e.g., "A4") */
    noteName: MusicalNoteName;
    /**
     * Frames captured during silence/transition before this note.
     * Used for analyzing attack quality and string crossing.
     */
    gapFrames: ReadonlyArray<TechniqueFrame>;
} | {
    type: 'OFFSET';
    /** Timestamp when note release was detected (ms) */
    timestamp: TimestampMs;
    /**
     * Complete segment data including all frames captured during this note's sustain phase.
     * Used for intonation, vibrato, and stability analysis.
     */
    segment: NoteSegment;
} | {
    type: 'NOTE_CHANGE';
    /** Timestamp of pitch change (ms) */
    timestamp: TimestampMs;
    /** The new detected note name */
    noteName: MusicalNoteName;
    /**
     * Complete segment data for the note that just ended.
     * Frames may indicate intentional glissando or unintentional sliding.
     */
    segment: NoteSegment;
};
/**
 * A stateful class that segments an audio stream into musical notes.
 *
 * @remarks
 * This class implements a state machine (`SILENCE` or `NOTE`) with hysteresis and temporal debouncing
 * to robustly identify the start and end of musical notes from a real-time audio stream.
 * It aggregates frames for a completed note and provides them in the `OFFSET` event payload.
 *
 * The core logic is based on:
 * - RMS thresholds to distinguish signal from silence.
 * - Confidence scores from the pitch detector to filter noise.
 * - Debouncing timers to prevent spurious events from short fluctuations.
 */
export declare class NoteSegmenter {
    private options;
    private state;
    private frames;
    private gapFrames;
    private lastSignalTime;
    private segmentCount;
    constructor(options?: Partial<SegmenterOptions>);
    /**
     * Processes a single audio analysis frame.
     *
     * @param frame - Current pitch detection result
     * @returns Event if state transition occurred, null otherwise
     *
     * @remarks
     * **State Machine**:
     * - SILENCE -> ONSET (when RMS > minRms)
     * - ONSET -> OFFSET (when RMS < maxRmsSilence for offsetDebounceMs)
     * - ONSET -> NOTE_CHANGE (when detected note changes)
     *
     * Uses debouncing to prevent false triggers from noise.
     */
    processFrame(frame: TechniqueFrame): SegmenterEvent | null;
    private handleSilenceState;
    private handleNoteState;
    private checkNoteChange;
    private createSegment;
    private pushToBuffer;
    /**
     * Resets segmenter to initial state.
     *
     * @remarks
     * Call between exercises or when audio context is recreated.
     * Discards all buffered frames and resets internal timers.
     */
    reset(): void;
}
