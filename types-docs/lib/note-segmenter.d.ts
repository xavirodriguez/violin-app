import { TechniqueFrame } from './technique-types';
export interface SegmenterOptions {
    minRms: number;
    maxRmsSilence: number;
    minConfidence: number;
    onsetDebounceMs: number;
    offsetDebounceMs: number;
}
export type SegmenterEvent = {
    type: 'ONSET';
    timestamp: number;
    noteName: string;
    gapFrames: TechniqueFrame[];
} | {
    type: 'OFFSET';
    timestamp: number;
    frames: TechniqueFrame[];
} | {
    type: 'NOTE_CHANGE';
    timestamp: number;
    noteName: string;
    frames: TechniqueFrame[];
};
export declare class NoteSegmenter {
    private options;
    private state;
    private currentNoteName;
    private frames;
    private gapFrames;
    private lastAboveThresholdTime;
    private lastBelowThresholdTime;
    constructor(options?: Partial<SegmenterOptions>);
    processFrame(frame: TechniqueFrame): SegmenterEvent | null;
    reset(): void;
}
