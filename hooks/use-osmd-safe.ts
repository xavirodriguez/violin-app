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
 */
export function useOSMDSafe(
  musicXML: string,
  options?: IOSMDOptions,
): {
  isReady: boolean
  error: string | undefined
  containerRef: import('react').RefObject<HTMLDivElement | null>
  resetCursor: () => void
  advanceCursor: () => void
  highlightCurrentNote: () => void
  highlightRange: (startIndex: number, endIndex: number) => void
  applyHeatmap: (precisionMap: Record<number, number>) => void
  onNoteClick: (
    handler: (data: { noteIndex: number; event: MouseEvent }) => void,
  ) => (() => void) | undefined
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

  const onNoteClick = useCallback(
    (handler: (data: { noteIndex: number; event: MouseEvent }) => void) => {
      if (!isReady || !osmdRef.current || !containerRef.current) return undefined

      const container = containerRef.current
      const osmd = osmdRef.current

      const handleClick = (event: MouseEvent) => {
        const target = event.target as SVGElement
        const gNoteElement = target.closest('.vf-stavenote, .vf-note')
        if (!gNoteElement) return

        const foundIndex = findNoteIndexFromElement(osmd, gNoteElement)
        if (foundIndex !== -1) {
          handler({ noteIndex: foundIndex, event })
        }
      }

      container.addEventListener('click', handleClick)
      return () => container.removeEventListener('click', handleClick)
    },
    [isReady],
  )

  const applyHeatmap = useCallback(
    (precisionMap: Record<number, number>) => {
      if (!isReady || !osmdRef.current || !containerRef.current) return

      const osmd = osmdRef.current
      iterateGraphicalNotes(osmd, (gNote, noteCounter) => {
        const precision = precisionMap[noteCounter]
        if (precision !== undefined) {
          const colorClass =
            precision < 0.7 ? 'heatmap-low' : precision < 0.85 ? 'heatmap-med' : 'heatmap-high'

          const el = (gNote as { getSVGGElement?: () => SVGElement | undefined }).getSVGGElement?.()
          if (el) {
            el.classList.remove('heatmap-low', 'heatmap-med', 'heatmap-high')
            el.classList.add(colorClass)
          }
        }
      })
    },
    [isReady],
  )

  const highlightCurrentNote = useCallback(() => {
    if (!isReady || !osmdRef.current || !containerRef.current) return

    const highlighted = containerRef.current.querySelectorAll('.note-current')
    highlighted.forEach((el) => el.classList.remove('note-current'))

    const gNotes = osmdRef.current.cursor.GNotesUnderCursor()
    if (gNotes) {
      gNotes.forEach((gn) => {
        ;(gn as { getSVGGElement?: () => SVGElement | undefined })
          .getSVGGElement?.()
          ?.classList.add('note-current')
      })
    }
  }, [isReady])

  const highlightRange = useCallback(
    (startIndex: number, endIndex: number) => {
      if (!isReady || !osmdRef.current || !containerRef.current) return

      const highlighted = containerRef.current.querySelectorAll('.note-loop-range')
      highlighted.forEach((el) => el.classList.remove('note-loop-range'))

      const osmd = osmdRef.current
      iterateGraphicalNotes(osmd, (gNote, noteCounter) => {
        if (noteCounter >= startIndex && noteCounter <= endIndex) {
          ;(gNote as { getSVGGElement?: () => SVGElement | undefined })
            .getSVGGElement?.()
            ?.classList.add('note-loop-range')
        }
      })
    },
    [isReady],
  )

  const scoreView = useMemo<ScoreViewPort>(
    () => ({
      isReady,
      sync: (noteIndex: number) => {
        if (!isReady || !osmdRef.current) return

        // Idempotent absolute sync
        const osmd = osmdRef.current
        osmd.cursor.reset()
        for (let i = 0; i < noteIndex; i++) {
          osmd.cursor.next()
        }

        const cursorElement = containerRef.current?.querySelector('.osmd-cursor')
        if (cursorElement) {
          cursorElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          })
        }

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
    [isReady, resetCursor, highlightCurrentNote],
  )

  return {
    isReady,
    error,
    containerRef,
    resetCursor,
    advanceCursor,
    highlightCurrentNote,
    highlightRange,
    applyHeatmap,
    onNoteClick,
    scoreView,
  }
}

interface StaffEntry {
  graphicalNotes: unknown[]
}
interface Measure {
  staffEntries: StaffEntry[]
}
interface GraphicalSheet {
  MeasureList: Measure[][]
}

/**
 * Iterates through all graphical notes in the OSMD instance.
 */
function iterateGraphicalNotes(
  osmd: OpenSheetMusicDisplay,
  callback: (gNote: unknown, noteCounter: number) => void,
): void {
  let noteCounter = 0
  try {
    const graphicSheet = (osmd as unknown as { GraphicSheet: GraphicalSheet }).GraphicSheet
    if (!graphicSheet || !graphicSheet.MeasureList) return

    processMeasureList(graphicSheet.MeasureList, (staffEntry) => {
      if (staffEntry.graphicalNotes) {
        staffEntry.graphicalNotes.forEach((gNote) => {
          callback(gNote, noteCounter)
        })
      }
      noteCounter++
    })
  } catch (e) {
    console.error('[OSMD] Error iterating graphical notes:', e)
  }
}

function processMeasureList(
  measureList: Measure[][],
  callback: (staffEntry: StaffEntry) => void,
): void {
  measureList.forEach((measureList) => {
    measureList.forEach((measure) => {
      if (measure && measure.staffEntries) {
        measure.staffEntries.forEach(callback)
      }
    })
  })
}

/**
 * Finds the index of a note given its SVG element.
 */
function findNoteIndexFromElement(osmd: OpenSheetMusicDisplay, targetElement: Element): number {
  let foundIndex = -1
  iterateGraphicalNotes(osmd, (gNote, noteCounter) => {
    if (
      foundIndex === -1 &&
      gNote &&
      typeof (gNote as { getSVGGElement?: () => SVGElement | undefined }).getSVGGElement ===
        'function' &&
      (gNote as { getSVGGElement?: () => SVGElement | undefined }).getSVGGElement() ===
        targetElement
    ) {
      foundIndex = noteCounter
    }
  })
  return foundIndex
}
