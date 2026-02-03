import { AudioFramePort, AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import { PitchDetector, PitchDetectionResult } from '../pitch-detector';
export declare class WebAudioFrameAdapter implements AudioFramePort {
    private analyser;
    private buffer;
    constructor(analyser: AnalyserNode);
    getFrame(): Float32Array;
    get sampleRate(): number;
}
export declare class WebAudioLoopAdapter implements AudioLoopPort {
    private framePort;
    constructor(framePort: AudioFramePort);
    start(onFrame: (frame: Float32Array) => void, signal: AbortSignal): Promise<void>;
}
export declare class PitchDetectorAdapter implements PitchDetectionPort {
    readonly detector: PitchDetector;
    constructor(detector: PitchDetector);
    detect(frame: Float32Array): PitchDetectionResult;
    calculateRMS(frame: Float32Array): number;
}
