import { PracticeStatus } from '@/lib/practice-core';
interface PracticeControlsProps {
    status: PracticeStatus;
    hasExercise: boolean;
    onStart: () => void;
    onStop: () => void;
    onRestart: () => void;
    progress: number;
    currentNoteIndex: number;
    totalNotes: number;
}
/**
 * Control bar for starting, stopping, and monitoring practice progress.
 */
export declare function PracticeControls(props: PracticeControlsProps): import("react/jsx-runtime").JSX.Element;
export {};
