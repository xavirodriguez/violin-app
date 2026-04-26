import { PracticeEngineEvent } from './engine.types';
import { AudioLoopPort, PitchDetectorPort } from './engine.ports';
import { Exercise } from '../exercises/types';
import { EngineState } from './engine.state';
import { PracticeReducer } from './engine.reducer';
/**
 * Configuration context for the {@link PracticeEngine}.
 *
 * @public
 */
export interface PracticeEngineContext {
    /** Source of raw audio frames. */
    audio: AudioLoopPort;
    /** Algorithm used to detect pitch and confidence. */
    pitch: PitchDetectorPort;
    /** The musical exercise being practiced. */
    exercise: Exercise;
    /** Optional custom reducer for state transitions. Defaults to {@link engineReducer}. */
    reducer?: PracticeReducer;
    /** Optional cents tolerance override. */
    centsTolerance?: number;
}
/**
 * Interface for the core musical practice engine.
 *
 * @public
 */
export interface PracticeEngine {
    /**
     * Starts the asynchronous engine loop.
     *
     * @param signal - An {@link AbortSignal} to terminate the loop.
     * @returns An async iterator yielding musical events in real-time.
     */
    start(signal: AbortSignal): AsyncIterable<PracticeEngineEvent>;
    /**
     * Immediately stops the engine and releases internal resources.
     */
    stop(): void;
    /**
     * Retrieves the current internal state of the engine.
     */
    getState(): EngineState;
}
/**
 * Factory function to create a new {@link PracticeEngine} instance.
 *
 * @param ctx - The execution context.
 * @returns A new PracticeEngine instance.
 * @public
 */
export declare function createPracticeEngine(ctx: PracticeEngineContext): PracticeEngine;
