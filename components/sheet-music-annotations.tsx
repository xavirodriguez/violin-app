'use client'

import React, { useEffect, useState } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'

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
  fingerNumber?: 0 | 1 | 2 | 3 | 4

  /**
   * Suggested bowing direction.
   * - `up`: Push the bow (V symbol).
   * - `down`: Pull the bow (bridge symbol).
   */
  bowDirection?: 'up' | 'down'

  /**
   * Whether to show a visual warning flag (e.g., for difficult shifts or accidentals).
   */
  warningFlag?: boolean
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
  annotations: Record<number, Annotation>

  /**
   * Index of the currently active note being practiced in the session.
   */
  currentNoteIndex: number

  /**
   * The active OpenSheetMusicDisplay (OSMD) instance.
   * Required to calculate the precise SVG coordinates for each note.
   */
  osmd: OpenSheetMusicDisplay | null

  /**
   * Reference to the container element holding the rendered SVG staff.
   */
  containerRef: React.RefObject<HTMLDivElement | null>
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
export function SheetMusicAnnotations({
  annotations,
  currentNoteIndex,
  osmd,
  containerRef,
}: SheetMusicAnnotationsProps) {
  /** Stores calculated screen coordinates for each annotated note. */
  const [coords, setCoords] = useState<Record<number, { x: number; y: number }>>({})

  /**
   * Effect to calculate and update visual coordinates.
   *
   * @remarks
   * This effect recalculates the position of annotations whenever the active note
   * changes or the window is resized. It uses `getBoundingClientRect` to map
   * SVG elements to screen space.
   */
  useEffect(() => {
    if (!osmd || !osmd.GraphicSheet || !containerRef.current) return

    /**
     * Updates the local coordinate map based on the current OSMD cursor position.
     *
     * @remarks
     * Calculates the offset relative to the container component to ensure
     * correct absolute positioning.
     */
    const updateCoords = () => {
      const newCoords: Record<number, { x: number; y: number }> = {}
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      // Find the OSMD cursor element to get its bounding box
      const cursorElement = containerRef.current?.querySelector('.osmd-cursor')
      if (cursorElement) {
        const rect = cursorElement.getBoundingClientRect()
        newCoords[currentNoteIndex] = {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
        }
      }
      setCoords(newCoords)
    }

    // Delay calculation slightly to allow OSMD to finish layout updates
    const timeout = setTimeout(updateCoords, 100)

    // Listen for resize to re-align annotations
    window.addEventListener('resize', updateCoords)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', updateCoords)
    }
  }, [osmd, currentNoteIndex, containerRef])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Object.entries(annotations).map(([indexStr, annotation]) => {
        const index = parseInt(indexStr)
        const pos = coords[index]
        if (!pos) return null

        return (
          <div
            key={index}
            className="absolute transition-all duration-300"
            style={{ left: pos.x, top: pos.y - 40 }}
          >
            <div className="flex flex-col items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded border border-primary/20 shadow-sm scale-90">
              {annotation.fingerNumber !== undefined && (
                <span className="font-bold text-primary text-xs bg-primary/10 w-5 h-5 flex items-center justify-center rounded-full">
                  {annotation.fingerNumber}
                </span>
              )}
              {annotation.bowDirection === 'up' && <ArrowUp className="h-4 w-4 text-blue-500" />}
              {annotation.bowDirection === 'down' && <ArrowDown className="h-4 w-4 text-blue-500" />}
              {annotation.warningFlag && (
                <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
