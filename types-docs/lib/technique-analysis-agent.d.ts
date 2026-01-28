import { TechniqueFrame, NoteSegment, NoteTechnique, Observation } from './technique-types';
export interface AnalysisOptions {
    settlingTimeMs: number;
    inTuneThresholdCents: number;
    vibratoMinRateHz: number;
    vibratoMaxRateHz: number;
    vibratoMinWidthCents: number;
    vibratoMinRegularity: number;
}
export declare class TechniqueAnalysisAgent {
    private options;
    constructor(options?: Partial<AnalysisOptions>);
    /**
     * Performs technical analysis on a completed note segment.
     *
     * @param segment - The current note segment to analyze.
     * @param gapFrames - The frames between the previous note and the current one (transitions).
     * @param prevSegment - The preceding note segment for contextual analysis.
     * @returns A `NoteTechnique` object containing all calculated metrics.
     */
    analyzeSegment(segment: NoteSegment, gapFrames?: TechniqueFrame[], prevSegment?: NoteSegment | null): NoteTechnique;
    private calculateStability;
    private calculateVibrato;
    private calculateAttackRelease;
    private calculateResonance;
    private calculateRhythm;
    private calculateTransition;
    /**
     * Generates a list of pedagogical observations based on technical metrics.
     *
     * @remarks
     * This method implements the intelligent feedback motor. It identifies technical
     * flaws, assigns severity and confidence levels, and ranks them to ensure
     * the most critical and certain feedback is presented first.
     */
    generateObservations(technique: NoteTechnique): Observation[];
    private calculateStdDev;
    private calculateDrift;
    private detrend;
    private findPeriod;
}
