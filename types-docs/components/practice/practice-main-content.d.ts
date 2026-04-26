/**
 * PracticeMainContent
 *
 * Orchestrates the main views of the practice mode: settings, library, and active session view.
 */
import { Exercise, Note } from '@/lib/exercises/types';
import { PracticeState, DetectedNote } from '@/lib/practice-core';
import { Observation } from '@/lib/technique-types';
import { useOSMDSafe } from '@/hooks/use-osmd-safe';
import { PracticeStoreState } from '@/lib/practice/practice-states';
import { PracticeSession } from '@/stores/analytics-store';
interface PracticeMainContentProps {
    state: PracticeStoreState;
    practiceState: PracticeState | undefined;
    status: string;
    isZenModeEnabled: boolean;
    autoStartEnabled: boolean;
    setAutoStart: (enabled: boolean) => void;
    setPreviewExercise: (exercise: Exercise) => void;
    currentNoteIndex: number;
    targetNote: Note | undefined;
    targetPitchName: string | undefined;
    lastDetectedNote: DetectedNote | undefined;
    liveObservations: Observation[];
    centsTolerance: number;
    sheetMusicView: 'focused' | 'full';
    setSheetMusicView: (view: 'focused' | 'full') => void;
    osmdHook: ReturnType<typeof useOSMDSafe>;
    handleRestart: () => void;
    sessions: PracticeSession[];
    start: () => void;
    stop: () => void;
    setIsZenModeEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
}
export declare function PracticeMainContent(props: PracticeMainContentProps): import("react/jsx-runtime").JSX.Element;
export {};
