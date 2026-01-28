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
     * This should be the `containerRef` returned by `useOSMDSafe`.
     */
    containerRef: React.RefObject<HTMLDivElement>;
    /** Indicates if the sheet music has finished rendering. */
    isReady: boolean;
    /** Error message to display if rendering fails. */
    error: string | null;
}
/**
 * Renders the visual container and loading/error states for sheet music.
 *
 * @param props - Component properties.
 * @returns A JSX element with styled loading, error, and score regions.
 *
 * @remarks
 * This component is decoupled from the OSMD logic and focuses on the UI
 * representation. It uses absolute positioning for the loading spinner to
 * prevent layout shifts when the score is ready.
 */
export declare function SheetMusic({ containerRef, isReady, error }: SheetMusicProps): import("react/jsx-runtime").JSX.Element;
export {};
