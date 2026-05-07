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
 */
export type SegmenterEvent = {
    type: 'ONSET';
    timestamp: TimestampMs;
    noteName: MusicalNoteName;
    gapFrames: ReadonlyArray<TechniqueFrame>;
} | {
    type: 'OFFSET';
    timestamp: TimestampMs;
    segment: NoteSegment;
} | {
    type: 'NOTE_CHANGE';
    timestamp: TimestampMs;
    noteName: MusicalNoteName;
    segment: NoteSegment;
};
/**
 * A stateful class that segments a continuous audio stream into discrete musical notes.
 *
 * @remarks
 * This class implements a state machine that handles the transition between silence
 * and active notes. It uses a series of debounce timers and thresholds to ensure
 * detection is stable and resistant to common audio artifacts like vibrato-induced
 * pitch shifts or momentary signal dropouts.
 *
 * **State Machine Transitions**:
 * 1. **SILENCE** → (Signal is bigger than `minRms` for `onsetDebounceMs`) → **ONSET** (Note starts)
 * 2. **NOTE** → (Signal is smaller than `maxRmsSilence` for `offsetDebounceMs`) → **OFFSET** (Note ends)
 * 3. **NOTE** → (Pitch changes for `noteChangeDebounceMs`) → **NOTE_CHANGE** (Legato transition)
 *
 * **Robustness Features**:
 * - **Gap Buffer**: Collects frames of silence *before* the onset for transition analysis.
 * - **Dropout Tolerance**: Prevents note termination if the pitch detector fails
 *   momentarily but the volume (RMS) remains high.
 *
 * @public
 */
export declare class NoteSegmenter {
    private readonly options;
    private state;
    private frames;
    private gapFrames;
    private lastSignalTime;
    private segmentCount;
    constructor(options?: Partial<SegmenterOptions>);
    /**
     * Processes a single audio frame and updates the internal state.
     *
     * @param frame - The latest pitch/amplitude data from the detector.
     * @returns A {@link SegmenterEvent} if a transition (Onset/Offset/Change) was triggered, otherwise undefined.
     */
    processFrame(frame: TechniqueFrame): SegmenterEvent | undefined;
    reset(): void;
    private isSignal;
    private handleSilenceState;
    private processSilenceSignal;
    private evaluateOnsetEligibility;
    private resetSilenceOnThreshold;
    private triggerOnset;
    private initializeNoteState;
    private prepareFramesForOnset;
    private handleNoteState;
    private detectNoteOffset;
    private shouldTriggerOffsetTimer;
    private resetOffsetTimer;
    private handleOffsetTimer;
    private triggerOffset;
    private detectNoteChange;
    private isDifferentNoteDetected;
    private resetPendingNoteChange;
    private processPendingNoteChange;
    private evaluateNoteChangeEligibility;
    private triggerNoteChange;
    private createSegment;
    private assembleSegment;
    private pushToBuffer;
}
