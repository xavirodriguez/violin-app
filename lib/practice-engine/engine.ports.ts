import { EngineState } from './engine.state'
import {
  AudioLoopPort as GlobalAudioLoopPort,
  PitchDetectionPort as GlobalPitchDetectionPort,
} from '../ports/audio.port'

/**
 * Port for retrieving raw audio frames from an input source.
 *
 * @public
 */
export type AudioLoopPort = GlobalAudioLoopPort

/**
 * Port for pitch detection and volume analysis.
 *
 * @public
 */
export type PitchDetectorPort = GlobalPitchDetectionPort

/**
 * Interface for controlling sheet music visual feedback.
 *
 * @public
 */
export interface ScoreCursorPort {
  /** Moves the active cursor to the specified note index. */
  moveTo(index: number): void
  /** Highlights the note at the specified index. */
  highlight(index: number): void
}

/**
 * State synchronization port for the engine.
 *
 * @public
 */
export interface PracticeStatePort {
  /** Retrieves the current persistent state. */
  getState(): EngineState
  /** Atomically updates the state with a new value. */
  update(next: EngineState): void
}
