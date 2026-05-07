import { AudioPlayerPort } from './ports/audio-player.port';
import { Exercise } from '@/lib/domain/exercise';
/**
 * Playback modes for the sequence player.
 * @public
 */
export type PlaybackMode = 'clean' | 'expressive';
/**
 * Service for playing a sequence of notes (e.g., an entire exercise).
 *
 * @public
 */
export declare class SequencePlayer {
    private player;
    private isPlaying;
    private abortController;
    constructor(player: AudioPlayerPort);
    /**
     * Plays the given exercise sequence.
     *
     * @param exercise - The exercise to play.
     * @param onNoteStart - Callback called when a note starts playing.
     * @param config - Optional configuration for BPM and playback mode.
     */
    play(exercise: Exercise, onNoteStart?: (index: number) => void, config?: {
        bpm?: number;
        mode?: PlaybackMode;
    }): Promise<void>;
    stop(): void;
}
