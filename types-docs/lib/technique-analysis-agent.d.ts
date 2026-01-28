import { TechniqueFrame, NoteSegment, NoteTechnique, Observation } from './technique-types';
export declare class TechniqueAnalysisAgent {
    analyzeSegment(segment: NoteSegment, gapFrames?: TechniqueFrame[]): NoteTechnique;
    private calculateStability;
    private calculateVibrato;
    private calculateAttackRelease;
    private calculateResonance;
    private calculateRhythm;
    private calculateTransition;
    generateObservations(technique: NoteTechnique): Observation[];
    private calculateStdDev;
    private calculateDrift;
    private detrend;
    private findPeriod;
}
