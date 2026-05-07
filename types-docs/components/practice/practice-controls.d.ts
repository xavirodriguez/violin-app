import { PracticeStatus } from '@/lib/domain/practice';
interface PracticeControlsProps {
    status: PracticeStatus;
    hasExercise: boolean;
    onStart: () => void;
    onStop: () => void;
    onRestart: () => void;
    onPlayReference?: () => void;
    isReferencePlaying?: boolean;
    onToggleMetronome?: () => void;
    isMetronomeActive?: boolean;
    visualBeat?: boolean;
    bpm: number;
    onBpmChange: (bpm: number) => void;
    progress: number;
    currentNoteIndex: number;
    totalNotes: number;
}
/**
 * Control bar for starting, stopping, and monitoring practice progress.
 */
export declare function PracticeControls(props: PracticeControlsProps): import("react/jsx-runtime").JSX.Element;
export {};
