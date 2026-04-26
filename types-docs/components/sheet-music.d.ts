/**
 * SheetMusic
 * A presentation component for rendering the OSMD sheet music container.
 */
import React from 'react';
/**
 * Props for the SheetMusic component.
 */
interface SheetMusicProps {
    /**
     * A ref to the div element where OSMD will render the score.
     */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Indicates if the sheet music has finished rendering. */
    isReady: boolean;
    /** Error message to display if rendering fails. */
    error: string | undefined;
}
/**
 * Renders the visual container and loading/error states for sheet music.
 */
export declare function SheetMusic({ containerRef, isReady, error }: SheetMusicProps): import("react/jsx-runtime").JSX.Element;
export {};
