import { TechniqueFrame, NoteSegment, NoteTechnique, Observation, AnalysisOptions } from './technique-types';
/**
 * A stateful agent that analyzes note segments to provide detailed technical feedback.
 *
 * @remarks
 * This class encapsulates the signal processing and heuristic logic for evaluating
 * various aspects of violin technique, such as vibrato, pitch stability, and rhythm.
 * It is designed to be instantiated once and reused for each note segment detected
 * in a practice session.
 *
 * The agent's workflow is typically:
 * 1.  `analyzeSegment` is called with a completed `NoteSegment`.
 * 2.  This produces a `NoteTechnique` object containing dozens of quantitative metrics.
 * 3.  `generateObservations` is called with the `NoteTechnique` object.
 * 4.  This produces an array of human-readable `Observation`s, which are prioritized
 *     and filtered pedagogical tips ready for display to the user.
 */
export declare class TechniqueAnalysisAgent {
    private options;
    /**
     * Constructs a new TechniqueAnalysisAgent with optional configuration.
     * @param options - Configuration overrides for the analysis heuristics.
     */
    constructor(options?: Partial<AnalysisOptions>);
    /**
     * Analyzes a `NoteSegment` and computes a comprehensive set of technique metrics.
     *
     * @param segment - The `NoteSegment` to analyze, containing all frames of the note.
     * @param gapFrames - Optional frames from the silence preceding the note, used for transition analysis.
     * @returns A `NoteTechnique` object with detailed metrics.
     */
    analyzeSegment(segment: NoteSegment, gapFrames?: TechniqueFrame[], prevSegment?: NoteSegment | null): NoteTechnique;
    private calculateStability;
    private calculateVibrato;
    private calculateAttackRelease;
    private calculateResonance;
    private calculateRhythm;
    private calculateTransition;
    calculateGlissando(gapFrames: TechniqueFrame[]): number;
    calculateLandingError(currentFrames: TechniqueFrame[], startTime: number): number;
    calculateCorrectionCount(currentFrames: TechniqueFrame[], startTime: number): number;
    /**
     * Generates a list of human-readable observations based on computed technique metrics.
     *
     * @remarks
     * This method acts as an "intelligent feedback motor". It applies a set of pedagogical rules
     * and heuristics to the quantitative data in the `NoteTechnique` object to produce
     * actionable, prioritized feedback for the user. The observations are sorted by
     * a combination of severity and confidence.
     *
     * @param technique - The `NoteTechnique` object produced by `analyzeSegment`.
     * @returns An array of `Observation` objects, ready for display.
     */
    generateObservations(technique: NoteTechnique): Observation[];
    private generateStabilityObservations;
    private generateVibratoObservations;
    private generateAttackObservations;
    private generateTransitionObservations;
    private generateResonanceObservations;
    private generateRhythmObservations;
    /** @internal */
    private calculateStdDev;
    /**
     * Calculates the pitch drift over a series of frames using linear regression.
     * @internal
     */
    private calculateDrift;
    /**
     * Removes the linear trend from a series of cents values.
     * @internal
     */
    private detrend;
    /**
     * Finds the dominant period in a signal using autocorrelation.
     * @internal
     */
    private findPeriod;
}
