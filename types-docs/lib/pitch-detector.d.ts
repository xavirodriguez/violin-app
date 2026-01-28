/**
 * Pure JavaScript pitch detection using the YIN algorithm.
 * No external dependencies - optimized for violin pitch detection.
 *
 * The YIN algorithm is considered the gold standard for monophonic pitch detection
 * and is particularly well-suited for musical instruments like the violin.
 *
 * Reference: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara (2002)
 */
export interface PitchDetectionResult {
    /** Detected frequency in Hz (0 if no pitch detected) */
    pitchHz: number;
    /** Confidence level from 0.0 to 1.0 */
    confidence: number;
}
/**
 * Pure JavaScript pitch detector optimized for violin.
 * Uses the YIN algorithm for accurate fundamental frequency detection.
 */
export declare class PitchDetector {
    private readonly sampleRate;
    /**
     * The minimum frequency we care about (in Hz).
     * For violin, the lowest note is G3 at ~196 Hz, but we go a bit lower for safety.
     */
    private readonly MIN_FREQUENCY;
    /**
     * The maximum frequency we care about (in Hz).
     * For violin, the highest common note is around E7 at ~2637 Hz.
     * We set this to 700 Hz by default to focus on the practical range for beginners.
     */
    private MAX_FREQUENCY;
    /**
     * The threshold for the YIN algorithm.
     * Lower values = more strict (fewer false positives, might miss quiet notes)
     * Higher values = more lenient (more detections, but less reliable)
     * 0.1 is a good balance for musical instruments.
     */
    private readonly YIN_THRESHOLD;
    /**
     * The default threshold for the Root Mean Square (RMS) calculation.
     * This value is used to determine if there's enough signal to attempt pitch detection.
     * An RMS value below this threshold is considered silence.
     */
    private readonly DEFAULT_RMS_THRESHOLD;
    constructor(sampleRate: number);
    /**
     * Detects the pitch of an audio buffer using the YIN algorithm.
     */
    detectPitch(buffer: Float32Array): PitchDetectionResult;
    /**
     * Calculates the Root Mean Square (RMS) of an audio buffer.
     */
    calculateRMS(buffer: Float32Array): number;
    /**
     * Utility method to detect if there's enough signal to attempt pitch detection.
     */
    hasSignal(buffer: Float32Array, threshold?: number): boolean;
    /**
     * Advanced pitch detection with built-in signal validation.
     */
    detectPitchWithValidation(buffer: Float32Array, rmsThreshold?: number): PitchDetectionResult;
    getSampleRate(): number;
    getFrequencyRange(): {
        min: number;
        max: number;
    };
    /**
     * Updates the maximum frequency threshold for pitch detection.
     * Higher values allow detecting notes in higher positions (e.g., E7 ~2637 Hz).
     */
    setMaxFrequency(maxHz: number): void;
}
/**
 * Helper function to create a PitchDetector from an AudioContext.
 */
export declare function createPitchDetectorFromContext(audioContext: AudioContext): PitchDetector;
