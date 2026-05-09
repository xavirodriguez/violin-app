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
  onNoteClick: (handler: (data: { noteIndex: number; event: MouseEvent }) => void) => any
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
      if (isReady && osmdRef.current && containerRef.current) {
        const container = containerRef.current
        const handleClick = (event: MouseEvent) => {
          if (!osmdRef.current) return
          const osmd = osmdRef.current

          const target = event.target as SVGElement
          const gNoteElement = target.closest('.vf-stavenote, .vf-note')
          if (!gNoteElement) return

          let foundIndex = -1
          let noteCounter = 0

          // Iterar por la estructura gráfica de OSMD para encontrar el índice de la nota
          try {
            for (const measure of (osmd as any).GraphicSheet.MeasureList) {
              for (const staffLines of measure) {
                if (!staffLines || !staffLines.staffEntries) continue
                for (const staffEntry of staffLines.staffEntries) {
                  const graphicalNotes = (staffEntry as any).graphicalNotes
                  if (graphicalNotes) {
                    for (const gNote of graphicalNotes) {
                      if (gNote && typeof gNote.getSVGGElement === 'function' && gNote.getSVGGElement() === gNoteElement) {
                        foundIndex = noteCounter
                        break
                      }
                    }
                  }
                  if (foundIndex !== -1) break
                  noteCounter++
                }
                if (foundIndex !== -1) break
              }
              if (foundIndex !== -1) break
            }
          } catch (e) {
            console.error('[OSMD] Error finding note index:', e)
          }

          if (foundIndex !== -1) {
            handler({ noteIndex: foundIndex, event })
          }
        }
        container.addEventListener('click', handleClick)
        return () => container.removeEventListener('click', handleClick)
      }
      return () => {}
    },
    [isReady],
  )

  const applyHeatmap = useCallback(
    (precisionMap: Record<number, number>) => {
      if (!isReady || !osmdRef.current || !containerRef.current) return

      const osmd = osmdRef.current
      let noteCounter = 0

      try {
        for (const measure of (osmd as any).GraphicSheet.MeasureList) {
          for (const staffLines of measure) {
            if (!staffLines || !staffLines.staffEntries) continue
            for (const staffEntry of staffLines.staffEntries) {
              const precision = precisionMap[noteCounter]
              if (precision !== undefined) {
                const colorClass =
                  precision < 0.7 ? 'heatmap-low' : precision < 0.85 ? 'heatmap-med' : 'heatmap-high'

                const graphicalNotes = (staffEntry as any).graphicalNotes
                if (graphicalNotes) {
                  for (const gNote of graphicalNotes) {
                    const el = gNote.getSVGGElement?.()
                    if (el) {
                      el.classList.remove('heatmap-low', 'heatmap-med', 'heatmap-high')
                      el.classList.add(colorClass)
                    }
                  }
                }
              }
              noteCounter++
            }
          }
        }
      } catch (e) {
        console.error('[OSMD] Error applying heatmap:', e)
      }
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
        (gn as any).getSVGGElement?.()?.classList.add('note-current')
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

      try {
        for (const measure of (osmd as any).GraphicSheet.MeasureList) {
          for (const staffLines of measure) {
            if (!staffLines || !staffLines.staffEntries) continue
            for (const staffEntry of staffLines.staffEntries) {
              if (noteCounter >= startIndex && noteCounter <= endIndex) {
                const graphicalNotes = (staffEntry as any).graphicalNotes
                if (graphicalNotes) {
                  for (const gNote of graphicalNotes) {
                    gNote.getSVGGElement?.()?.classList.add('note-loop-range')
                  }
                }
              }
              noteCounter++
            }
          }
        }
      } catch (e) {
        console.error('[OSMD] Error highlighting range:', e)
      }
    },
    [isReady],
  )

  const scoreView = useMemo<ScoreViewPort>(
    () => ({
      isReady,
      sync: (noteIndex: number) => {
        if (!isReady || !osmdRef.current) return

        if (noteIndex === 0) {
          resetCursor()
        } else {
          advanceCursor()
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
    [isReady, resetCursor, highlightCurrentNote, advanceCursor],
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
