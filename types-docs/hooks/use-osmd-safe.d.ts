/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */
import { IOSMDOptions } from 'opensheetmusicdisplay';
/**
 * Hook that abstracts the complex initialization and cleanup lifecycle of OSMD.
 *
 * @param musicXML - The MusicXML string to render.
 * @param options - Optional OSMD configuration options.
 * @returns An object containing the container ref, readiness state, error status, and cursor control functions.
 *
 * @remarks
 * OSMD requires a DOM element to be available before instantiation. This hook:
 * 1. Manages a `containerRef` that should be attached to a `div`.
 * 2. Re-initializes OSMD whenever `musicXML` or `options` change.
 * 3. Handles asynchronous loading and rendering of the score.
 * 4. Provides safe wrappers for cursor manipulation (`resetCursor`, `advanceCursor`).
 * 5. Ensures proper cleanup of OSMD resources on unmount to prevent memory leaks.
 *
 * @example
 * ```tsx
 * const { containerRef, isReady, resetCursor } = useOSMDSafe(xmlString);
 *
 * return (
 *   <div>
 *     <button onClick={resetCursor} disabled={!isReady}>Reset</button>
 *     <div ref={containerRef} />
 *   </div>
 * );
 * ```
 */
export declare function useOSMDSafe(musicXML: string, options?: IOSMDOptions): {
    isReady: boolean;
    error: string | null;
    containerRef: import("react").RefObject<HTMLDivElement | null>;
    resetCursor: () => void;
    advanceCursor: () => void;
};
