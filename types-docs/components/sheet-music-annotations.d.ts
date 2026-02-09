import React from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
/**
 * Visual metadata for a specific note on the sheet music.
 *
 * @public
 */
export interface Annotation {
    /** Suggested finger number (1-4). 0 for open string. */
    fingerNumber?: 0 | 1 | 2 | 3 | 4;
    /** Suggested bowing direction ('up' for push, 'down' for pull). */
    bowDirection?: 'up' | 'down';
    /** Whether to show a visual warning flag (e.g., for difficult shifts). */
    warningFlag?: boolean;
}
/**
 * Props for the {@link SheetMusicAnnotations} component.
 */
interface SheetMusicAnnotationsProps {
    /** Map of note index to its respective annotations. */
    annotations: Record<number, Annotation>;
    /** Index of the currently active note being practiced. */
    currentNoteIndex: number;
    /** The active OSMD instance used for calculating musical coordinates. */
    osmd: OpenSheetMusicDisplay | null;
    /** Reference to the container element holding the rendered SVG staff. */
    containerRef: React.RefObject<HTMLDivElement | null>;
}
/**
 * Overlay component that renders pedagogical annotations directly over the sheet music.
 *
 * @remarks
 * This component uses the OSMD cursor position to dynamically calculate where to
 * place annotations (fingerings, bowing signs) in relation to the rendered staff.
 * It synchronizes with the `currentNoteIndex` to show relevant hints exactly where
 * the user should be looking.
 *
 * **Performance Note**: Coordinate calculations are debounced and respond to
 * window resize events to maintain visual alignment.
 *
 * @param props - Component props.
 * @public
 */
export declare function SheetMusicAnnotations({ annotations, currentNoteIndex, osmd, containerRef, }: SheetMusicAnnotationsProps): import("react/jsx-runtime").JSX.Element;
export {};
