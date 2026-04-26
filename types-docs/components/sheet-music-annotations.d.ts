import React from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
/**
 * Visual metadata for a specific note on the sheet music.
 *
 * @remarks
 * Encapsulates the pedagogical hints that are rendered as an overlay on the SVG staff.
 *
 * @public
 */
export interface Annotation {
    /**
     * Suggested finger number (1-4).
     * `0` represents an open string.
     */
    fingerNumber?: 0 | 1 | 2 | 3 | 4;
    /**
     * Suggested bowing direction.
     * - `up`: Push the bow (V symbol).
     * - `down`: Pull the bow (bridge symbol).
     */
    bowDirection?: 'up' | 'down';
    /**
     * Whether to show a visual warning flag (e.g., for difficult shifts or accidentals).
     */
    warningFlag?: boolean;
}
/**
 * Props for the {@link SheetMusicAnnotations} component.
 *
 * @public
 */
interface SheetMusicAnnotationsProps {
    /**
     * Map of note index to its respective pedagogical annotations.
     */
    annotations: Record<number, Annotation>;
    /**
     * Index of the currently active note being practiced in the session.
     */
    currentNoteIndex: number;
    /**
     * The active OpenSheetMusicDisplay (OSMD) instance.
     * Required to calculate the precise SVG coordinates for each note.
     */
    osmd: OpenSheetMusicDisplay | null | undefined;
    /**
     * Reference to the container element holding the rendered SVG staff.
     */
    containerRef: React.RefObject<HTMLDivElement | null>;
}
/**
 * Overlay component that renders pedagogical annotations directly over the sheet music staff.
 *
 * @remarks
 * This component acts as a "Head-Up Display" (HUD) for students. It uses the OSMD
 * cursor position to dynamically calculate where to place annotations (fingerings,
 * bowing signs) in relation to the rendered SVG elements.
 *
 * **Implementation Details**:
 * - **Coordinate Mapping**: Translates raw SVG/Canvas coordinates from OSMD to
 *   absolute CSS positioning for React-based overlay elements.
 * - **Synchronization**: Updates alignment whenever `currentNoteIndex` changes or
 *   on window resize.
 * - **Visual Design**: Uses backdrop blurs and transitions to ensure annotations
 *   are readable without obscuring the underlying musical notation.
 *
 * **Performance**: Coordinate lookups are debounced (100ms) to ensure smooth
 * rendering without blocking the main UI thread during resizing or rapid playback.
 *
 * @param props - Component props.
 *
 * @example
 * ```tsx
 * <SheetMusicAnnotations
 *   annotations={{ 0: { fingerNumber: 1 } }}
 *   currentNoteIndex={0}
 *   osmd={osmdInstance}
 *   containerRef={ref}
 * />
 * ```
 *
 * @public
 */
export declare function SheetMusicAnnotations({ annotations, currentNoteIndex, osmd, containerRef, }: SheetMusicAnnotationsProps): import("react/jsx-runtime").JSX.Element;
export {};
