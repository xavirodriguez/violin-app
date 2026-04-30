/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { ScoreViewPort } from '@/lib/ports/score-view.port';
/**
 * Hook for safely managing OpenSheetMusicDisplay instances.
 * Refactored for documented lifecycle behavior and null elimination.
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
    /** Highlights the note at the given index */
    highlightCurrentNote: () => void;
    /** Reference to the OSMD instance for advanced interactions */
    osmd: OpenSheetMusicDisplay | undefined;
    /** Implementation of the ScoreViewPort for decoupled visual control */
    scoreView: ScoreViewPort;
};
