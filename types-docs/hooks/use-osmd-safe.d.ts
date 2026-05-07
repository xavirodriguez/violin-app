/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */
import { IOSMDOptions } from 'opensheetmusicdisplay';
import { ScoreViewPort } from '@/lib/ports/score-view.port';
/**
 * Hook for safely managing OpenSheetMusicDisplay (OSMD) instances in a React lifecycle.
 *
 * @remarks
 * This hook encapsulates the complex initialization, rendering, and cleanup logic
 * of the OSMD library. It ensures that the renderer is properly attached to the
 * DOM and provides high-level methods for cursor control and note highlighting.
 *
 * **Memory & Performance**:
 * - Automatically clears the OSMD instance on unmount to prevent memory leaks.
 * - Uses a `loadTokenRef` to ensure that only the latest `musicXML` load request
 *   updates the state, preventing race conditions during rapid re-renders.
 *
 * @param musicXML - Valid MusicXML 3.1 string
 * @param options - OSMD configuration
 *
 * @returns Object with:
 * - `containerRef`: Attach to a `<div>` element
 * - `isReady`: True when OSMD is initialized and rendered
 * - `error`: Error message if initialization failed
 * - `resetCursor()`: Resets cursor to start (no-op if !isReady)
 * - `advanceCursor()`: Moves cursor forward (no-op if !isReady)
 *
 * @remarks
 * **Preconditions**:
 * 1. `containerRef` MUST be attached to a mounted DOM element
 * 2. Cursor methods are safe to call anytime (no-op when !isReady)
 * 3. Re-initializes when `musicXML` or `options` change
 *
 * @example
 * ```tsx
 * function SheetMusic({ xml }: { xml: string }) {
 *   const { containerRef, isReady, resetCursor } = useOSMDSafe(xml);
 *
 *   return (
 *     <>
 *       <button onClick={resetCursor} disabled={!isReady}>
 *         Reset
 *       </button>
 *       <div ref={containerRef} />
 *     </>
 *   );
 * }
 * ```
 */
export declare function useOSMDSafe(musicXML: string, options?: IOSMDOptions): {
    isReady: boolean;
    error: string | undefined;
    containerRef: import('react').RefObject<HTMLDivElement | null>;
    /** Safe to call anytime - no-op when !isReady */
    resetCursor: () => void;
    /** Safe to call anytime - no-op when !isReady */
    advanceCursor: () => void;
    /** Highlights the notes currently under the OSMD cursor. */
    highlightCurrentNote: () => void;
    /** Highlights a range of notes. */
    highlightRange: (startIndex: number, endIndex: number) => void;
    /** Applies heatmap coloring to notes based on precision. */
    applyHeatmap: (precisionMap: Record<number, number>) => void;
    /** Safe to call anytime - no-op when !isReady */
    onNoteClick: (handler: (data: {
        noteIndex: number;
        event: MouseEvent;
    }) => void) => void;
    /** Implementation of the ScoreViewPort for decoupled visual control */
    scoreView: ScoreViewPort;
};
