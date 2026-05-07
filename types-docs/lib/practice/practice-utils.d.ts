/**
 * practice-utils
 *
 * Pure utility functions for the practice mode domain.
 */
import { PracticeState, DetectedNote, PracticeStatus } from '@/lib/domain/practice';
import { Note } from '@/lib/domain/exercise';
/**
 * Derived state used by UI components to represent the current progress
 * and targets of a practice session.
 */
export interface DerivedPracticeState {
    status: PracticeStatus;
    currentNoteIndex: number;
    targetNote: Note | undefined;
    totalNotes: number;
    progress: number;
    lastDetectedNote: DetectedNote | undefined;
    targetPitchName: string | undefined;
}
/**
 * Derives calculated UI state from the raw practice domain state.
 *
 * @param practiceState - The current state from the practice engine.
 * @returns A simplified representation for UI consumption.
 */
export declare function derivePracticeState(practiceState: PracticeState | undefined): DerivedPracticeState;
