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
    /** Whether the signal was normalized due to weak signal. */
    isNormalized?: boolean;
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
    static readonly DEFAULT_MIN_FREQUENCY = 180;
    private MIN_FREQUENCY;
    /**
     * The maximum frequency we care about (in Hz).
     * For violin, the practical upper limit is E7 at ~2637 Hz.
     * We set this to 3000 Hz by default to comfortably support the full professional range.
     */
    private MAX_FREQUENCY;
    /**
     * The threshold for the YIN algorithm.
     * Lower values = more strict (fewer false positives, might miss quiet notes)
     * Higher values = more lenient (more detections, but less reliable)
     *
     * @remarks
     * Practical YIN threshold heuristic. Tune with real instrument recordings if
     * detection behavior changes. 0.1 is often a good balance for musical instruments,
     * but is not a benchmark-proven optimum for every environment.
     */
    static readonly DEFAULT_YIN_THRESHOLD = 0.1;
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
     * @param maxFrequency - Optional maximum frequency threshold (defaults to 3000 Hz).
     * @throws Will throw an error if the sample rate is not a positive number.
     */
    constructor(sampleRate: number, maxFrequency?: number, minFrequency?: number);
    /**
     * Detects the pitch of an audio buffer using the full YIN algorithm.
     *
     * @remarks
     * This is the core method of the class. It processes a raw audio buffer and returns the
     * detected frequency and a confidence level.
     *
     * **Algorithmic Steps**:
     * 1. **Difference Function**: Measures how much the signal differs from itself when shifted by a lag (tau).
     * 2. **Cumulative Mean Normalized Difference**: Normalizes the difference to prevent the algorithm
     *    from biased towards low periods (high frequencies), reducing "octave errors".
     * 3. **Absolute Threshold**: Finds the first lag where the normalized difference is below `YIN_THRESHOLD`.
     * 4. **Parabolic Interpolation**: Refines the discrete lag estimate to achieve sub-sample precision.
     *
     * @param buffer - A `Float32Array` of raw audio data.
     * @returns A `PitchDetectionResult` object. If no pitch is detected, `pitchHz` and `confidence` will be 0.
     */
    detectPitch(buffer: Float32Array): PitchDetectionResult;
    private executeYinAnalysis;
    private validateAndRefineYinResult;
    /**
     * Calculates the Root Mean Square (RMS) of an audio buffer, which represents its volume.
     *
     * @param buffer - The audio data to analyze.
     * @returns The RMS value, a non-negative number.
     */
    calculateRMS(buffer: Float32Array): number;
    /**
     * Normalizes an audio buffer so that its peak amplitude is 1.0.
     *
     * @remarks
     * This is useful for detecting pitch in very quiet signals that would otherwise
     * be rejected by RMS or confidence thresholds.
     *
     * @param buffer - The raw audio data.
     * @returns A new Float32Array with normalized samples, or the original if it was silent.
     */
    normalize(buffer: Float32Array): Float32Array;
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
     * @param adaptive - If true, will attempt to normalize very weak signals to rescue detection.
     * @returns A `PitchDetectionResult`. If the signal is below the threshold, it returns a result indicating no pitch.
     * @defaultValue `rmsThreshold` is `this.DEFAULT_RMS_THRESHOLD`.
     */
    detectPitchWithValidation(buffer: Float32Array, rmsThreshold?: number, adaptive?: boolean): PitchDetectionResult;
    /**
     * Gets the sample rate the detector was configured with.
     * Refactored for range validation.
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
    /**
     * Updates the minimum frequency threshold for pitch detection.
     *
     * @param minHz - Minimum frequency in Hz (must be > 20 and < MAX_FREQUENCY)
     * @throws AppError - CODE: DATA_VALIDATION_ERROR if out of valid range
     */
    setMinFrequency(minHz: number): void;
    private calculateSearchRange;
    private refineAndValidatePitch;
    private isFrequencyInRange;
    /**
     * Step 1: Difference function.
     *
     * Calculates the squared difference between the signal and its delayed version for each lag (tau).
     * Effectively a measure of "un-correlation".
     */
    private difference;
    private calculateSquaredDifferenceSum;
    /**
     * Step 2: Cumulative mean normalized difference function.
     *
     * This is the "magic" of YIN. It divides each difference by the average of all preceding
     * differences. This prevents the search from getting stuck in a local minimum at tau=0
     * and helps avoid detecting harmonics as the fundamental frequency.
     */
    private cumulativeMeanNormalizedDifference;
    /**
     * Step 3: Absolute threshold.
     *
     * Finds the first local minimum that falls below the `YIN_THRESHOLD`.
     * If no such minimum exists, falls back to the global minimum (less reliable).
     */
    private absoluteThreshold;
    private findFirstBelowThreshold;
    private localMinimum;
    private findGlobalMinimum;
    /**
     * Step 4: Parabolic interpolation.
     *
     * Refines the detected lag (tau) by fitting a parabola through the minimum and its neighbors.
     * This allows the detector to find frequencies that don't align perfectly with the sample rate.
     */
    private parabolicInterpolation;
    private isAtSearchEdge;
    private calculateParabolicCorrection;
    /**
     * Simple Zero-Crossing algorithm to estimate frequency.
     *
     * @remarks
     * Not as robust as YIN for complex signals, but very fast and useful as a
     * second opinion for high-confidence clean signals.
     *
     * @param buffer - Audio samples.
     * @returns Frequency in Hz.
     */
    detectZeroCrossing(buffer: Float32Array): number;
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
/**
 * Factory function to create a PitchDetector instance based on difficulty.
 *
 * @param difficulty - The difficulty level of the exercise.
 * @param sampleRate - The audio sample rate.
 * @returns A PitchDetector instance configured for the difficulty.
 */
export declare function createPitchDetectorForDifficulty(difficulty: 'Beginner' | 'Intermediate' | 'Advanced', sampleRate: number): PitchDetector;
