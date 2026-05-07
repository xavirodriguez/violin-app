export type PitchDebugEvent = {
    stage: 'raw_audio';
    rms: number;
    isNormalized?: boolean;
    timestamp: number;
} | {
    stage: 'yin_normalized';
    originalRms: number;
    timestamp: number;
} | {
    stage: 'yin_silent';
    rms: number;
    threshold: number;
    timestamp: number;
} | {
    stage: 'yin_no_pitch';
    rms: number;
    confidence: number;
    isNormalized?: boolean;
    timestamp: number;
} | {
    stage: 'yin_out_of_range';
    pitchHz: number;
    minHz: number;
    maxHz: number;
    timestamp: number;
} | {
    stage: 'yin_detected';
    pitchHz: number;
    confidence: number;
    rms: number;
    isNormalized?: boolean;
    timestamp: number;
} | {
    stage: 'quality_rejected';
    reason: 'low_rms' | 'low_confidence' | 'unpitched';
    rms: number;
    confidence: number;
    noteName: string;
    timestamp: number;
} | {
    stage: 'quality_passed';
    noteName: string;
    cents: number;
    rms: number;
    confidence: number;
    timestamp: number;
} | {
    stage: 'segmenter_frame';
    segmenterState: 'SILENCE' | 'NOTE';
    isSignal: boolean;
    isSilence: boolean;
    isNormalized?: boolean;
    timestamp: number;
} | {
    stage: 'segmenter_event';
    eventType: 'ONSET' | 'OFFSET' | 'NOTE_CHANGE';
    noteName: string;
    timestamp: number;
} | {
    stage: 'match_check';
    detectedNote: string;
    targetNote: string;
    cents: number;
    centsTolerance: number;
    durationMs: number;
    requiredHoldTime: number;
    passed: boolean;
    timestamp: number;
};
type DebugListener = (event: PitchDebugEvent) => void;
export declare const pitchDebugBus: {
    emit: (event: PitchDebugEvent) => void;
    subscribe: (listener: DebugListener) => () => void;
};
export {};
