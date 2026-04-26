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
    analyzeSegment(params: {
        segment: NoteSegment;
        gapFrames?: ReadonlyArray<TechniqueFrame>;
        prevSegment?: NoteSegment;
    }): NoteTechnique;
    /**
     * Generates a set of user-facing observations from the technique metrics.
     */
    generateObservations(technique: NoteTechnique): Observation[];
    private buildTechniqueObject;
    private collectObservations;
    private prioritizeObservations;
    private calculateStability;
    private computeStabilityMetrics;
    private calculateSettlingStd;
    private calculateInTuneRatio;
    private createEmptyStability;
    private calculateVibrato;
    private assembleVibratoResult;
    private computeVibratoMetrics;
    private executeVibratoAnalysis;
    private calculateVibratoRate;
    private isVibratoCandidate;
    private isVibratoValid;
    private calculateAttackRelease;
    private executeAttackReleaseAnalysis;
    private createEmptyAttackRelease;
    private analyzeAttackPhase;
    private calculateAttackTime;
    private calculateStableRms;
    private calculatePitchScoop;
    private analyzeReleasePhase;
    private calculateResonance;
    private computeResonanceMetrics;
    private createEmptyResonance;
    private calculateLowConfRatio;
    private calculateRmsBeatingScore;
    private detectWolfTone;
    private calculateRhythm;
    private calculateTransition;
    private calculateTransitionTime;
    private calculateGlissAmount;
    private calculateLandingErrorMetric;
    private calculateCorrectionMetric;
    private calculateGlissando;
    private calculateLandingError;
    private calculateCorrectionCount;
    private generateStabilityObservations;
    private generateVibratoObservations;
    private analyzePresentVibrato;
    private checkSlowVibrato;
    private assembleSlowVibratoObservation;
    private checkWideVibrato;
    private assembleWideVibratoObservation;
    private analyzeInconsistentVibrato;
    private isCandidateForInconsistency;
    private assembleInconsistentVibratoObservation;
    private generateAttackObservations;
    private analyzeSlowAttack;
    private analyzePitchScoop;
    private generateTransitionObservations;
    private analyzeAudibleGlissando;
    private assembleGlissandoObservation;
    private analyzeLandingError;
    private generateResonanceObservations;
    private assembleResonanceObservation;
    private generateRhythmObservations;
    private calculateStdDev;
    private performLinearRegression;
    private calculateRegressionSums;
    private detrend;
    private findPeriod;
    private evaluatePeriod;
    private calculateAutocorrelation;
}
