/**
 * SheetMusicContainer
 *
 * Manages the display and annotations for the exercise sheet music.
 */
import { PracticeState } from '@/lib/domain/practice';
import { ScoreViewPort } from '@/lib/ports/score-view.port';
interface SheetMusicContainerProps {
    status: string;
    sheetMusicView: 'focused' | 'full';
    setSheetMusicView: (v: 'focused' | 'full') => void;
    practiceState: PracticeState | undefined;
    osmd: {
        isReady: boolean;
        error: string | undefined;
        containerRef: import('react').RefObject<HTMLDivElement | null>;
        scoreView: ScoreViewPort;
        applyHeatmap?: (precisionMap: Record<number, number>) => void;
    };
    currentNoteIndex: number;
}
export declare function SheetMusicContainer(props: SheetMusicContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
