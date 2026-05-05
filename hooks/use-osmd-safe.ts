/**
 * useOSMDSafe
 * A custom React hook for safely initializing and managing OpenSheetMusicDisplay (OSMD) instances.
 */

'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay'
import { ScoreViewPort } from '@/lib/ports/score-view.port'

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
  /** Highlights the notes currently under the OSMD cursor. */
  highlightCurrentNote: () => void
  /** Highlights a range of notes. */
  highlightRange: (startIndex: number, endIndex: number) => void
  /** Applies heatmap coloring to notes based on precision. */
  applyHeatmap: (precisionMap: Record<number, number>) => void
  /** Safe to call anytime - no-op when !isReady */
  onNoteClick: (handler: (data: { noteIndex: number; event: MouseEvent }) => void) => void
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

          // Add click listeners to notes for audio reference
          const svg = containerRef.current?.querySelector('svg')
          if (svg) {
            svg.addEventListener('click', (event) => {
              const target = event.target as SVGElement
              const gNote = target.closest('.vf-stavenote')
              if (gNote) {
                // Heuristic to find the note ID from the rendered SVG
                // In a production app, we would use OSMD's internal mapping
                // For now, we trigger playNote if we can identify it
                console.log('Note clicked:', gNote)
              }
            })
          }
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

  const onNoteClick = useCallback(
    (handler: (data: { noteIndex: number; event: MouseEvent }) => void) => {
      if (isReady && osmdRef.current && containerRef.current) {
        const container = containerRef.current
        const handleClick = (event: MouseEvent) => {
          if (!osmdRef.current) return
          const osmd = osmdRef.current

          const target = event.target as SVGElement
          const gNoteElement = target.closest('.vf-stavenote, .vf-note')
          if (!gNoteElement) return

          // Find which note this corresponds to by iterating through all graphical notes
          let foundIndex = -1
          let noteCounter = 0

          for (const measure of osmd.GraphicSheet.MeasureList) {
            for (const staffLines of measure) {
              for (const staffEntry of staffLines.staffEntries) {
                for (const gNote of staffEntry.graphicalNotes) {
                  // @ts-ignore - getSVGGElement is available at runtime for SVG backend
                  if (gNote.getSVGGElement() === gNoteElement) {
                    foundIndex = noteCounter
                    break
                  }
                }
                if (foundIndex !== -1) break
                noteCounter++
              }
              if (foundIndex !== -1) break
            }
            if (foundIndex !== -1) break
          }

          if (foundIndex !== -1) {
            handler({ noteIndex: foundIndex, event })
          }
        }
        container.addEventListener('click', handleClick)
        return () => container.removeEventListener('click', handleClick)
      }
    },
    [isReady],
  )

  const applyHeatmap = useCallback(
    (precisionMap: Record<number, number>) => {
      if (!isReady || !osmdRef.current || !containerRef.current) return

      const osmd = osmdRef.current
      let noteCounter = 0

      for (const measure of osmd.GraphicSheet.MeasureList) {
        for (const staffLines of measure) {
          for (const staffEntry of staffLines.staffEntries) {
            const precision = precisionMap[noteCounter]
            if (precision !== undefined) {
              const colorClass =
                precision < 0.7 ? 'heatmap-low' : precision < 0.85 ? 'heatmap-med' : 'heatmap-high'

              for (const gNote of staffEntry.graphicalNotes) {
                // @ts-ignore
                const el = gNote.getSVGGElement()
                if (el) {
                  el.classList.remove('heatmap-low', 'heatmap-med', 'heatmap-high')
                  el.classList.add(colorClass)
                }
              }
            }
            noteCounter++
          }
        }
      }
    },
    [isReady],
  )

  /**
   * Highlights the notes currently under the OSMD cursor.
   *
   * @remarks
   * This does not seek to an arbitrary note index. It reads the current cursor
   * position from OSMD, removes previous `.note-current` markers, and applies the
   * marker to the notes currently under the cursor.
   *
   * No-ops when OSMD is not ready or the container is unavailable.
   */
  const highlightCurrentNote = useCallback(() => {
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

  const highlightRange = useCallback(
    (startIndex: number, endIndex: number) => {
      if (!isReady || !osmdRef.current || !containerRef.current) return

      const highlighted = containerRef.current.querySelectorAll('.note-loop-range')
      highlighted.forEach((el) => el.classList.remove('note-loop-range'))

      const osmd = osmdRef.current
      let noteCounter = 0

      for (const measure of osmd.GraphicSheet.MeasureList) {
        for (const staffLines of measure) {
          for (const staffEntry of staffLines.staffEntries) {
            if (noteCounter >= startIndex && noteCounter <= endIndex) {
              for (const gNote of staffEntry.graphicalNotes) {
                // @ts-ignore
                gNote.getSVGGElement()?.classList.add('note-loop-range')
              }
            }
            noteCounter++
          }
        }
      }
    },
    [isReady],
  )

  const scoreView = useMemo<ScoreViewPort>(
    () => ({
      isReady,
      /**
       * Keeps the OSMD cursor moving with the normal sequential practice flow.
       *
       * @remarks
       * Resets the cursor when `noteIndex` is 0. For any other index, advances
       * the cursor by exactly one step.
       *
       * This function does not seek to an arbitrary note index. If practice navigation
       * starts supporting non-sequential jumps, this logic must be replaced with an
       * explicit cursor-positioning strategy.
       */
      sync: (noteIndex: number) => {
        if (!isReady || !osmdRef.current) return

        // 1. Move cursor
        if (noteIndex === 0) {
          resetCursor()
        } else {
          // Note: Incremental advance for now to match previous behavior
          advanceCursor()
        }

        // 2. Scroll (Keep note visible)
        const cursorElement = containerRef.current?.querySelector('.osmd-cursor')
        if (cursorElement) {
          cursorElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          })
        }

        // 3. Highlight (depends on cursor position)
        highlightCurrentNote()
      },
      reset: resetCursor,
      getCursorPosition: () => {
        if (!isReady || !containerRef.current) return undefined

        const containerRect = containerRef.current.getBoundingClientRect()
        const cursorElement = containerRef.current.querySelector('.osmd-cursor')
        if (cursorElement) {
          const rect = cursorElement.getBoundingClientRect()
          return {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
          }
        }
        return undefined
      },
    }),
    [isReady, resetCursor, highlightCurrentNote, advanceCursor],
  )

  return {
    isReady,
    error,
    containerRef,
    resetCursor,
    advanceCursor,
    highlightCurrentNote,
    onNoteClick,
    scoreView,
  }
}
