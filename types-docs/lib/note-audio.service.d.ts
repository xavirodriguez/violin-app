import { Note as TargetNote } from '@/lib/domain/exercise';
/**
 * Service to map musical notes to audio frequencies.
 *
 * @public
 */
export declare const NoteAudioService: {
    /**
     * Gets the frequency for a target note.
     *
     * @param targetNote - The note from the exercise.
     * @returns The frequency in Hz.
     */
    getFrequencyFromTargetNote(targetNote: TargetNote): number;
    /**
     * Gets the frequency from a note name string.
     *
     * @param noteName - Scientific pitch notation name (e.g., "A4").
     * @returns The frequency in Hz.
     */
    getFrequencyFromNoteName(noteName: string): number;
};
