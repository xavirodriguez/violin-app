/**
 * Types and interfaces for advanced violin technique analysis.
 */
export interface TechniqueFrame {
    timestamp: number;
    pitchHz: number;
    cents: number;
    rms: number;
    confidence: number;
    noteName: string;
}
export interface VibratoMetrics {
    present: boolean;
    rateHz: number;
    widthCents: number;
    regularity: number;
}
export interface PitchStability {
    settlingStdCents: number;
    globalStdCents: number;
    driftCentsPerSec: number;
    inTuneRatio: number;
}
export interface AttackReleaseMetrics {
    attackTimeMs: number;
    pitchScoopCents: number;
    releaseStability: number;
}
export interface ResonanceMetrics {
    suspectedWolf: boolean;
    rmsBeatingScore: number;
    pitchChaosScore: number;
    lowConfRatio: number;
}
export interface TransitionMetrics {
    transitionTimeMs: number;
    glissAmountCents: number;
    landingErrorCents: number;
    correctionCount: number;
}
export interface RhythmMetrics {
    onsetErrorMs: number;
    durationErrorMs?: number;
}
export interface NoteTechnique {
    vibrato: VibratoMetrics;
    pitchStability: PitchStability;
    attackRelease: AttackReleaseMetrics;
    resonance: ResonanceMetrics;
    rhythm: RhythmMetrics;
    transition: TransitionMetrics;
}
export interface NoteSegment {
    noteIndex: number;
    targetPitch: string;
    startTime: number;
    endTime: number;
    expectedStartTime?: number;
    expectedDuration?: number;
    frames: TechniqueFrame[];
}
export interface Observation {
    type: 'intonation' | 'vibrato' | 'rhythm' | 'attack' | 'stability' | 'resonance' | 'transition';
    severity: 1 | 2 | 3;
    confidence: number;
    message: string;
    tip: string;
    evidence?: any;
}
