import { TechniqueFrame, NoteSegment, NoteTechnique, Observation, AnalysisOptions } from './technique-types';
/**
 * A stateful agent that analyzes note segments to provide detailed technical feedback.
 */
export declare class TechniqueAnalysisAgent {
    private options;
    constructor(options?: AnalysisOptions);
    /**
     * Analyzes a `NoteSegment` and computes a comprehensive set of technique metrics.
     */
    analyzeSegment(segment: NoteSegment, gapFrames?: ReadonlyArray<TechniqueFrame>, prevSegment?: NoteSegment | null): NoteTechnique;
    private calculateStability;
    private calculateVibrato;
    private calculateAttackRelease;
    private calculateResonance;
    private calculateRhythm;
    private calculateTransition;
    private calculateGlissando;
    private calculateLandingError;
    private calculateCorrectionCount;
    generateObservations(technique: NoteTechnique): Observation[];
    private generateStabilityObservations;
    private generateVibratoObservations;
    private generateAttackObservations;
    private generateTransitionObservations;
    private generateResonanceObservations;
    private generateRhythmObservations;
    private calculateStdDev;
    private calculateDrift;
    private detrend;
    private findPeriod;
}
