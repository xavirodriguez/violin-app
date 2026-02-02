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
 *
 * @remarks
 * This class encapsulates the YIN algorithm implementation and its configuration.
 * It is designed to be instantiated once per audio stream and reused for each audio buffer.
 * The core logic is based on the original paper by de Cheveigné and Kawahara.
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
    /**
     * Constructs a new PitchDetector instance.
     *
     * @param sampleRate - The sample rate of the audio context in which the detector will be used.
     * @throws Will throw an error if the sample rate is not a positive number.
     */
    constructor(sampleRate: number);
    /**
     * Detects the pitch of an audio buffer using the full YIN algorithm.
     *
     * @remarks
     * This is the core method of the class. It processes a raw audio buffer and returns the
     * detected frequency and a confidence level. For performance, it's recommended to use
     * `detectPitchWithValidation` to avoid running the algorithm on silent buffers.
     *
     * @param buffer - A `Float32Array` of raw audio data.
     * @returns A `PitchDetectionResult` object. If no pitch is detected, `pitchHz` and `confidence` will be 0.
     */
    detectPitch(buffer: Float32Array): PitchDetectionResult;
    /** Step 1: Difference function */
    private difference;
    /** Step 2: Cumulative mean normalized difference function */
    private cumulativeMeanNormalizedDifference;
    /** Step 3: Absolute threshold */
    private absoluteThreshold;
    /** Step 4: Parabolic interpolation */
    private parabolicInterpolation;
    /**
     * Calculates the Root Mean Square (RMS) of an audio buffer, which represents its volume.
     *
     * @param buffer - The audio data to analyze.
     * @returns The RMS value, a non-negative number.
     */
    calculateRMS(buffer: Float32Array): number;
    /**
     * Utility method to detect if there's enough signal to attempt pitch detection.
     *
     * @remarks
     * This is used as a performance optimization to avoid running the expensive YIN algorithm
     * on buffers that are essentially silent.
     *
     * @param buffer - The audio data to check.
     * @param threshold - The RMS threshold above which a signal is considered present.
     * @returns `true` if the buffer's RMS exceeds the threshold, `false` otherwise.
     * @defaultValue `threshold` is `this.DEFAULT_RMS_THRESHOLD`.
     */
    hasSignal(buffer: Float32Array, threshold?: number): boolean;
    /**
     * A wrapper around `detectPitch` that first validates if the signal is strong enough.
     *
     * @remarks
     * This is the recommended method for real-time pitch detection, as it prevents
     * unnecessary computation on silent audio frames.
     *
     * @param buffer - The audio data to analyze.
     * @param rmsThreshold - The RMS threshold to use for the signal check.
     * @returns A `PitchDetectionResult`. If the signal is below the threshold, it returns a result indicating no pitch.
     * @defaultValue `rmsThreshold` is `this.DEFAULT_RMS_THRESHOLD`.
     */
    detectPitchWithValidation(buffer: Float32Array, rmsThreshold?: number): PitchDetectionResult;
    /**
     * Gets the sample rate the detector was configured with.
     * @returns The sample rate in Hz.
     */
    getSampleRate(): number;
    /**
     * Gets the effective frequency range the detector is configured to find.
     * @returns An object containing the min and max frequencies in Hz.
     */
    getFrequencyRange(): {
        min: number;
        max: number;
    };
    /**
     * Updates the maximum frequency threshold for pitch detection.
     *
     * @param maxHz - Maximum frequency in Hz (must be \> MIN_FREQUENCY and \<= 20000)
     * @throws AppError - CODE: DATA_VALIDATION_ERROR if out of valid range
     *
     * @example
     * detector.setMaxFrequency(2637);  // ✅ E7 for violin
     * detector.setMaxFrequency(-100);  // ❌ Throws AppError
     * detector.setMaxFrequency(25000); // ❌ Throws AppError (above human hearing)
     */
    setMaxFrequency(maxHz: number): void;
}
/**
 * Helper function to create a PitchDetector from a Web Audio API `AudioContext`.
 *
 * @remarks
 * This is a convenience factory function that extracts the correct sample rate from
 * the audio context, ensuring the `PitchDetector` is properly configured.
 *
 * @param audioContext - The `AudioContext` of the current audio pipeline.
 * @returns A new, correctly configured `PitchDetector` instance.
 */
export declare function createPitchDetectorFromContext(audioContext: AudioContext): PitchDetector;
