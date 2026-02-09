import { PracticeEngineStatus, Observation, NoteTechnique } from './engine.types';
export interface PracticeEngineState {
    status: PracticeEngineStatus;
    currentNoteIndex: number;
    scoreLength: number;
    liveObservations: Observation[];
    lastTechnique?: NoteTechnique;
    perfectNoteStreak: number;
}
export declare const INITIAL_ENGINE_STATE: PracticeEngineState;
