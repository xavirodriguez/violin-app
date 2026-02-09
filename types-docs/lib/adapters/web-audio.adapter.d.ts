import { AudioFramePort, AudioLoopPort, PitchDetectionPort } from '../ports/audio.port';
import { PitchDetector, PitchDetectionResult } from '../pitch-detector';
/**
 * Adapter that connects a Web Audio {@link AnalyserNode} to the {@link AudioFramePort}.
 *
 * @remarks
 * This class handles the extraction of time-domain data from the Web Audio graph
 * and ensures it's compatible with the internal audio processing pipeline.
 * It uses a pre-allocated buffer to minimize garbage collection overhead during
 * high-frequency sampling.
 *
 * @public
 */
export declare class WebAudioFrameAdapter implements AudioFramePort {
    private analyser;
    private buffer;
    /**
     * Creates an instance of WebAudioFrameAdapter.
     *
     * @param analyser - The Web Audio AnalyserNode to pull data from.
     */
    constructor(analyser: AnalyserNode);
    /**
     * Captures the current time-domain data from the analyser node.
     *
     * @remarks
     * This method uses `getFloatTimeDomainData` which provides PCM samples
     * in the range [-1.0, 1.0].
     *
     * @returns A {@link Float32Array} containing the audio samples.
     */
    getFrame(): Float32Array;
    /**
     * Returns the sample rate of the underlying AudioContext.
     */
    get sampleRate(): number;
}
/**
 * Adapter that implements {@link AudioLoopPort} using browser scheduling.
 *
 * @remarks
 * Uses `requestAnimationFrame` to drive the audio processing loop.
 *
 * **Performance Note**: While suitable for UI-synced applications, this loop
 * will be throttled or paused by the browser when the tab is in the background.
 * For background-stable processing, consider a Web Worker implementation.
 *
 * @public
 */
export declare class WebAudioLoopAdapter implements AudioLoopPort {
    private framePort;
    /**
     * Creates an instance of WebAudioLoopAdapter.
     *
     * @param framePort - The source of audio frames.
     */
    constructor(framePort: AudioFramePort);
    /**
     * Starts the animation-frame-based audio loop.
     *
     * @param onFrame - Callback for each audio frame.
     * @param signal - AbortSignal to stop the loop.
     * @returns A promise that resolves when the loop is terminated.
     */
    start(onFrame: (frame: Float32Array) => void, signal: AbortSignal): Promise<void>;
}
/**
 * Adapter that wraps a standard {@link PitchDetector} to satisfy the {@link PitchDetectionPort} interface.
 *
 * @remarks
 * This serves as a bridge between the core pitch detection algorithm and the port-based architecture.
 * It ensures that the detector's output is correctly mapped to the domain results.
 *
 * @public
 */
export declare class PitchDetectorAdapter implements PitchDetectionPort {
    readonly detector: PitchDetector;
    /**
     * Creates an instance of PitchDetectorAdapter.
     *
     * @param detector - The underlying pitch detector implementation.
     */
    constructor(detector: PitchDetector);
    /**
     * Detects pitch in the given audio frame.
     *
     * @param frame - Audio samples.
     * @returns Detection result including pitch and confidence.
     */
    detect(frame: Float32Array): PitchDetectionResult;
    /**
     * Calculates the volume (RMS) of the given audio frame.
     *
     * @param frame - Audio samples.
     * @returns RMS value (typically 0.0 to 1.0).
     */
    calculateRMS(frame: Float32Array): number;
}
