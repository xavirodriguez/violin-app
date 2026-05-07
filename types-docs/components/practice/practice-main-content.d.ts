/**
 * PracticeMainContent
 *
 * Orchestrates the main views of the practice mode: settings, library, and active session view.
 */
import { Exercise } from '@/lib/domain/exercise';
import { ScoreViewPort } from '@/lib/ports/score-view.port';
import { PracticeSession } from '@/lib/domain/practice';
interface PracticeMainContentProps {
    isZenModeEnabled: boolean;
    autoStartEnabled: boolean;
    setPreviewExercise: (exercise: Exercise) => void;
    centsTolerance: number;
    sheetMusicView: 'focused' | 'full';
    setSheetMusicView: (view: 'focused' | 'full') => void;
    osmd: {
        isReady: boolean;
        error: string | undefined;
        containerRef: import('react').RefObject<HTMLDivElement | null>;
        scoreView: ScoreViewPort;
        applyHeatmap: (precisionMap: Record<number, number>) => void;
    };
    sessions: PracticeSession[];
    onToggleZenMode: () => void;
}
export declare function PracticeMainContent(props: PracticeMainContentProps): import("react/jsx-runtime").JSX.Element;
export {};
