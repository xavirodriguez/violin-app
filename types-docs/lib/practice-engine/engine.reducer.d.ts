import { PracticeEngineState } from './engine.state';
import { PracticeEngineEvent } from './engine.types';
export type PracticeReducer = (state: PracticeEngineState, event: PracticeEngineEvent) => PracticeEngineState;
export declare const engineReducer: PracticeReducer;
