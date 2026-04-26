import { EngineStatus, Observation, NoteTechnique } from './engine.types';
/**
 * The complete, reactive state of a {@link PracticeEngine} session.
 *
 * @public
 */
export interface EngineState {
    /** The current status of the engine loop. */
    status: EngineStatus;
    /** The zero-based index of the note currently being practiced. */
    currentNoteIndex: number;
    /** The total number of notes in the active exercise. */
    scoreLength: number;
    /** High-frequency observations for the currently detected pitch. */
    liveObservations: Observation[];
    /** The technical metrics of the most recently matched note. */
    lastTechnique?: NoteTechnique;
    /** Number of consecutive notes that met the 'perfect' threshold. */
    perfectNoteStreak: number;
}
/**
 * Default starting state for a new engine instance.
 *
 * @public
 */
export declare const INITIAL_ENGINE_STATE: EngineState;
