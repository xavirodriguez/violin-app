/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */

'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay'
import { ScoreViewPort } from '@/lib/ports/score-view.port'

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
export function useOSMDSafe(
  musicXML: string,
  options?: IOSMDOptions,
): {
  isReady: boolean
  error: string | undefined
  containerRef: import('react').RefObject<HTMLDivElement | null>
  /** Safe to call anytime - no-op when !isReady */
  resetCursor: () => void
  /** Safe to call anytime - no-op when !isReady */
  advanceCursor: () => void
  /** Highlights the note at the given index */
  highlightCurrentNote: (noteIndex: number) => void
  /** Reference to the OSMD instance for advanced interactions */
  osmd: OpenSheetMusicDisplay | undefined
  /** Implementation of the ScoreViewPort for decoupled visual control */
  scoreView: ScoreViewPort
} {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<OpenSheetMusicDisplay | undefined>(undefined)
  const loadTokenRef = useRef(0)

  useEffect(() => {
    let isMounted = true
    const token = ++loadTokenRef.current

    async function initializeOSMD() {
      if (!containerRef.current || !musicXML) return
      if (osmdRef.current) osmdRef.current.clear()

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
        await osmd.load(musicXML)
        if (token !== loadTokenRef.current) return
        osmd.render()

        if (isMounted) {
          osmd.cursor.show()
          setIsReady(true)
          setError(undefined)
        }
      } catch (err) {
        console.error('[OSMD] Error loading or rendering sheet music:', err)
        if (isMounted && token === loadTokenRef.current) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.')
          setIsReady(false)
        }
      }
    }

    setIsReady(false)
    initializeOSMD()

    return () => {
      isMounted = false
    }
  }, [musicXML, JSON.stringify(options)])

  useEffect(() => {
    return () => {
      osmdRef.current?.clear()
    }
  }, [])

  const resetCursor = useCallback(() => {
    if (isReady && osmdRef.current) {
      osmdRef.current.cursor.reset()
      osmdRef.current.cursor.show()
    }
  }, [isReady])

  const advanceCursor = useCallback(() => {
    if (isReady && osmdRef.current) {
      osmdRef.current.cursor.next()
    }
  }, [isReady])

  const highlightCurrentNote = useCallback(
    (noteIndex: number) => {
      if (!isReady || !osmdRef.current || !containerRef.current) return

      const highlighted = containerRef.current.querySelectorAll('.note-current')
      highlighted.forEach((el) => el.classList.remove('note-current'))

      const gNotes = osmdRef.current.cursor.GNotesUnderCursor()
    if (gNotes) {
      gNotes.forEach((gn) => {
        // @ts-expect-error - getSVGGElement exists at runtime for SVG backend
        gn.getSVGGElement()?.classList.add('note-current')
      })
    }
  }, [isReady])

  const scoreView = useMemo<ScoreViewPort>(
    () => ({
      isReady,
      sync: (noteIndex: number) => {
        if (!isReady || !osmdRef.current) return

        // 1. Move cursor
        if (noteIndex === 0) {
          resetCursor()
        } else {
          // Note: Incremental advance for now to match previous behavior
          advanceCursor()
        }

        // 2. Highlight
        highlightCurrentNote(noteIndex)

        // 3. Scroll
        const cursorElement = containerRef.current?.querySelector('.osmd-cursor')
        if (cursorElement) {
          cursorElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          })
        }
      },
      reset: resetCursor,
    }),
    [isReady, resetCursor, highlightCurrentNote],
  )

  return {
    isReady,
    error,
    containerRef,
    resetCursor,
    advanceCursor,
    highlightCurrentNote,
    osmd: osmdRef.current,
    scoreView,
  }
}
