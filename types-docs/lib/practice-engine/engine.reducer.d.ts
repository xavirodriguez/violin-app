import { EngineState } from './engine.state';
import { PracticeEngineEvent } from './engine.types';
/**
 * Pure reducer function for the {@link PracticeEngine} state.
 *
 * @public
 */
export type PracticeReducer = (state: EngineState, event: PracticeEngineEvent) => EngineState;
/**
 * Reducer for the musical practice engine, handling transitions between states.
 *
 * @remarks
 * This implementation uses a record-based handler map to ensure the function
 * stays within the recommended line limit while being easily extensible.
 *
 * @param state - Current engine state.
 * @param event - The event to process.
 * @returns The next engine state.
 * @public
 */
export declare const engineReducer: PracticeReducer;
