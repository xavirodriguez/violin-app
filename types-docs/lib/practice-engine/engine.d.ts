import { PracticeEngineEvent } from './engine.types';
import { AudioLoopPort, PitchDetectorPort } from './engine.ports';
import { Exercise } from '../exercises/types';
import { EngineState } from './engine.state';
import { PracticeReducer } from './engine.reducer';
import { NoteTechnique, Observation } from '../technique-types';
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
    /** The index of the note to start practicing from. */
    initialNoteIndex?: number;
    /** The minimum RMS threshold for signal detection. */
    minRms?: number;
    /** The loop region if active. */
    loopRegion?: import('@/lib/domain/practice').LoopRegion;
    /** The current BPM. */
    bpm?: number;
}
/**
 * Interface for the core musical practice engine.
 *
 * @remarks
 * The PracticeEngine is the central orchestrator for a musical practice session.
 * It is responsible for:
 * 1. **Audio Integration**: Consuming raw frames from an `AudioLoopPort`.
 * 2. **Note Progression**: Automatically advancing through the score as notes are matched.
 * 3. **Adaptive Difficulty**: Dynamically adjusting intonation and hold thresholds.
 * 4. **State Management**: Maintaining the reactive `EngineState` through a reducer.
 *
 * It operates as an asynchronous loop that yields `PracticeEngineEvent` objects,
 * allowing the UI to react to musical milestones in real-time.
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
/**
 * Calculates adaptive difficulty parameters based on performance history.
 *
 * @param perfectNoteStreak - Current streak of perfect notes.
 * @returns Object containing intonation tolerance and required hold duration.
 * @internal
 */
/** @internal */
export declare function calculateAdaptiveDifficulty(perfectNoteStreak: number): {
    centsTolerance: number;
    requiredHoldTime: number;
};
/** @internal */
export declare function mapMatchedEvent(payload: {
    technique?: NoteTechnique;
    observations?: Observation[];
    isPerfect?: boolean;
}): PracticeEngineEvent;
