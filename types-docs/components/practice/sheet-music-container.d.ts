/**
 * SheetMusicContainer
 *
 * Manages the display and annotations for the exercise sheet music.
 */
import { PracticeState } from '@/lib/practice-core';
import { useOSMDSafe } from '@/hooks/use-osmd-safe';
interface SheetMusicContainerProps {
    status: string;
    sheetMusicView: 'focused' | 'full';
    setSheetMusicView: (v: 'focused' | 'full') => void;
    practiceState: PracticeState | undefined;
    osmdHook: ReturnType<typeof useOSMDSafe>;
    currentNoteIndex: number;
}
export declare function SheetMusicContainer(props: SheetMusicContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
