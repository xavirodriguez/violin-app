import { TechniqueFrame } from './technique-types';
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
}
/**
 * Possible segmenter events emitted during note detection.
 *
 * @remarks
 * Event Sequence:
 * 1. ONSET: Sound begins -\> new note detected
 * 2. NOTE_CHANGE: Pitch changes mid-sound (unusual, may indicate sliding)
 * 3. OFFSET: Sound ends -\> note completed with full analysis
 */
export type SegmenterEvent = {
    type: 'ONSET';
    /** Timestamp when note attack was detected (ms) */
    timestamp: number;
    /** The detected note name (e.g., "A4") */
    noteName: string;
    /**
     * Frames captured during silence/transition before this note.
     * Used for analyzing attack quality and string crossing.
     */
    gapFrames: TechniqueFrame[];
} | {
    type: 'OFFSET';
    /** Timestamp when note release was detected (ms) */
    timestamp: number;
    /**
     * All frames captured during this note's sustain phase.
     * Used for intonation, vibrato, and stability analysis.
     */
    frames: TechniqueFrame[];
} | {
    type: 'NOTE_CHANGE';
    /** Timestamp of pitch change (ms) */
    timestamp: number;
    /** The new detected note name */
    noteName: string;
    /**
     * Frames captured during the pitch transition.
     * May indicate intentional glissando or unintentional sliding.
     */
    frames: TechniqueFrame[];
};
/**
 * A stateful class that processes a stream of `TechniqueFrame`s and emits events for note onsets, offsets, and changes.
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
    private currentNoteName;
    private frames;
    private gapFrames;
    private lastAboveThresholdTime;
    private lastBelowThresholdTime;
    private lastSignalTime;
    private pendingNoteName;
    private pendingSince;
    /**
     * Constructs a new `NoteSegmenter`.
     * @param options - Optional configuration to override the default segmentation parameters.
     */
    constructor(options?: Partial<SegmenterOptions>);
    /**
     * Processes a single audio analysis frame.
     *
     * @param frame - Current pitch detection result
     * @returns Event if state transition occurred, null otherwise
     *
     * @remarks
     * **State Machine**:
     * - SILENCE -\> ONSET (when RMS \> minRms)
     * - ONSET -\> OFFSET (when RMS \< maxRmsSilence for offsetDebounceMs)
     * - ONSET -\> NOTE_CHANGE (when detected note changes)
     *
     * Uses debouncing to prevent false triggers from noise.
     */
    processFrame(frame: TechniqueFrame): SegmenterEvent | null;
    private handleSilenceState;
    private handleNoteState;
    private checkNoteChange;
    /**
     * Resets segmenter to initial state.
     *
     * @remarks
     * Call between exercises or when audio context is recreated.
     * Discards all buffered frames and resets internal timers.
     */
    reset(): void;
}
