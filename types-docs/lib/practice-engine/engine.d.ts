import { PracticeEngineEvent } from './engine.types';
import { AudioFramePort, PitchDetectorPort } from './engine.ports';
import { Exercise } from '../exercises/types';
import { PracticeEngineState } from './engine.state';
import { PracticeReducer } from './engine.reducer';
export interface PracticeEngineContext {
    audio: AudioFramePort;
    pitch: PitchDetectorPort;
    exercise: Exercise;
    reducer?: PracticeReducer;
}
export interface PracticeEngine {
    start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent>;
    stop(): void;
    getState(): PracticeEngineState;
}
export declare function createPracticeEngine(ctx: PracticeEngineContext): PracticeEngine;
