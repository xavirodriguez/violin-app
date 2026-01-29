/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay'

/**
 * Hook for safely managing OpenSheetMusicDisplay instances.
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
 * **Lifecycle**:
 * - Mount: Creates OSMD instance when containerRef is available
 * - Update: Destroys and recreates on musicXML/options change
 * - Unmount: Cleans up OSMD resources automatically
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
export function useOSMDSafe(
  musicXML: string,
  options?: IOSMDOptions,
): {
  isReady: boolean
  error: string | null
  containerRef: import('react').RefObject<HTMLDivElement | null>
  /** Safe to call anytime - no-op when !isReady */
  resetCursor: () => void
  /** Safe to call anytime - no-op when !isReady */
  advanceCursor: () => void
} {
  /** Indicates if the sheet music has been successfully loaded and rendered. */
  const [isReady, setIsReady] = useState(false)

  /** Contains the error message if loading or rendering fails. */
  const [error, setError] = useState<string | null>(null)

  /** Ref to be attached to the HTML container where OSMD will render. */
  const containerRef = useRef<HTMLDivElement>(null)

  /** Internal ref to the OSMD instance. */
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)

  /** Ref to track the current load token to handle race conditions. */
  const loadTokenRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const token = ++loadTokenRef.current

    async function initializeOSMD() {
      if (!containerRef.current || !musicXML) return

      // Performance Optimization: Only re-instantiate if absolutely necessary
      // If we already have an instance, we might just want to reload the XML
      // But OSMD is tricky with re-rendering on the same container.
      // For now, we clear the container to ensure a clean state.
      if (osmdRef.current) {
        osmdRef.current.clear()
      }

      // 1. Create instance and associate with the container
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: 'svg',
        drawTitle: false,
        followCursor: true,
        disableCursor: false,
        ...options,
      })
      osmdRef.current = osmd

      try {
        // 2. Load the MusicXML
        await osmd.load(musicXML)

        // 3. Guard against race conditions: check if this is still the latest load request
        if (token !== loadTokenRef.current) return

        // 4. Render the score
        osmd.render()

        // 5. Show cursor and set ready state
        if (isMounted) {
          osmd.cursor.show()
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        console.error('[OSMD] Error loading or rendering sheet music:', err)
        if (isMounted && token === loadTokenRef.current) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.')
          setIsReady(false)
        }
      }
    }

    setIsReady(false) // Reset ready state while loading
    initializeOSMD()

    return () => {
      isMounted = false
    }
  }, [musicXML, JSON.stringify(options)])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      osmdRef.current?.clear()
    }
  }, [])

  /** Resets the OSMD cursor to the beginning of the score. */
  const resetCursor = useCallback(() => {
    if (isReady && osmdRef.current) {
      osmdRef.current.cursor.reset()
      osmdRef.current.cursor.show()
    }
  }, [isReady])

  /** Advances the OSMD cursor to the next note or measure. */
  const advanceCursor = useCallback(() => {
    if (isReady && osmdRef.current) {
      osmdRef.current.cursor.next()
    }
  }, [isReady])

  return {
    isReady,
    error,
    containerRef,
    resetCursor,
    advanceCursor,
  }
}
