import { PracticeEngineState } from './engine.state';
export interface AudioFramePort {
    start(callback: (frame: Float32Array) => void, signal: AbortSignal): Promise<void>;
}
export interface PitchDetectorPort {
    detect(frame: Float32Array): {
        pitchHz: number;
        confidence: number;
    };
    calculateRMS(frame: Float32Array): number;
}
export interface ScoreCursorPort {
    moveTo(index: number): void;
    highlight(index: number): void;
}
export interface PracticeStatePort {
    getState(): PracticeEngineState;
    update(next: PracticeEngineState): void;
}
