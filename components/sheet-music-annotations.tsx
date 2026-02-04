'use client'

import React, { useEffect, useState } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'

/**
 * Visual metadata for a specific note on the sheet music.
 *
 * @public
 */
export interface Annotation {
  /** Suggested finger number (1-4). 0 for open string. */
  fingerNumber?: 0 | 1 | 2 | 3 | 4
  /** Suggested bowing direction. */
  bowDirection?: 'up' | 'down'
  /** Whether to show a visual warning flag (e.g., for difficult shifts). */
  warningFlag?: boolean
}

/**
 * Props for the {@link SheetMusicAnnotations} component.
 *
 * @public
 */
interface SheetMusicAnnotationsProps {
  /** Map of note index to its respective annotations. */
  annotations: Record<number, Annotation>
  /** Index of the currently active note. */
  currentNoteIndex: number
  /** The active OSMD instance used for coordinate calculation. */
  osmd: OpenSheetMusicDisplay | null
  /** Reference to the container element holding the sheet music. */
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Overlay component that renders pedagogical annotations directly over the sheet music.
 *
 * @remarks
 * This component uses the OSMD cursor position to dynamically calculate where to
 * place annotations (fingerings, bowing signs) in relation to the rendered staff.
 * It synchronizes with the `currentNoteIndex` to show relevant hints at the right time.
 *
 * @param props - Component props.
 * @public
 */
export function SheetMusicAnnotations({
  annotations,
  currentNoteIndex,
  osmd,
  containerRef,
}: SheetMusicAnnotationsProps) {
  const [coords, setCoords] = useState<Record<number, { x: number; y: number }>>({})

  useEffect(() => {
    if (!osmd || !osmd.GraphicSheet || !containerRef.current) return

    /**
     * Updates the local coordinate map based on the current OSMD cursor position.
     */
    const updateCoords = () => {
      const newCoords: Record<number, { x: number; y: number }> = {}
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

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

    const timeout = setTimeout(updateCoords, 100)
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
