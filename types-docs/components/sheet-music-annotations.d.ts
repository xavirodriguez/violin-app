import React from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
export interface Annotation {
    fingerNumber?: 0 | 1 | 2 | 3 | 4;
    bowDirection?: 'up' | 'down';
    warningFlag?: boolean;
}
interface SheetMusicAnnotationsProps {
    annotations: Record<number, Annotation>;
    currentNoteIndex: number;
    osmd: OpenSheetMusicDisplay | null;
    containerRef: React.RefObject<HTMLDivElement | null>;
}
export declare function SheetMusicAnnotations({ annotations, currentNoteIndex, osmd, containerRef }: SheetMusicAnnotationsProps): import("react/jsx-runtime").JSX.Element;
export {};
