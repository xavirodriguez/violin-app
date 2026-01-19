'use client'

import { useEffect, useState, useRef } from 'react'
import { OpenSheetMusicDisplay, Cursor } from 'opensheetmusicdisplay'

export function useOSMDSafe(musicXML: string, currentNoteIndex: number) {
  const [osmd, setOsmd] = useState<OpenSheetMusicDisplay | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<Cursor | null>(null)

  useEffect(() => {
    if (!containerRef.current || !musicXML) return

    let instance: OpenSheetMusicDisplay | null = null
    let isMounted = true

    async function initializeOSMD() {
      try {
        instance = new OpenSheetMusicDisplay(containerRef.current!, {
          autoResize: true,
          backend: 'svg',
          drawTitle: false,
          followCursor: true,
          disableCursor: false,
        })

        await instance.load(musicXML)
        await instance.render()

        // Wait for next tick to ensure DOM is updated
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (
          instance.GraphicSheet &&
          instance.GraphicSheet.MeasureList &&
          instance.GraphicSheet.MeasureList.length > 0
        ) {
          const firstMeasure = instance.GraphicSheet.MeasureList[0]
          if (firstMeasure && firstMeasure[0].staffEntries) {
            if (isMounted) {
              setOsmd(instance)
              cursorRef.current = instance.cursor
              setIsReady(true)
              setError(null)
              instance.cursor.show()
            }
          } else {
            throw new Error('OSMD graphic initialized but staffEntries missing')
          }
        } else {
          throw new Error('OSMD graphic not properly initialized')
        }
      } catch (err) {
        console.error('[OSMD] Initialization error:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load sheet music')
          setIsReady(false)
        }
      }
    }

    initializeOSMD()

    return () => {
      isMounted = false
      instance?.clear()
    }
  }, [musicXML])

  // Update cursor position
  useEffect(() => {
    if (!isReady || !cursorRef.current) return

    const cursor = cursorRef.current
    cursor.reset()
    for (let i = 0; i < currentNoteIndex; i++) {
      cursor.next()
    }
  }, [currentNoteIndex, isReady])

  return {
    osmd,
    isReady,
    error,
    containerRef,
  }
}
