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
        instance.render() // This is synchronous, but graphic population might not be.

        // Defensively check for the presence of the graphic data.
        if (
          !instance.graphic?.measureList ||
          instance.graphic.measureList.length === 0
        ) {
          // If not ready, wait a tick and check again as a fallback.
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Final check after the potential delay.
        if (
          !instance.graphic?.measureList ||
          instance.graphic.measureList.length === 0
        ) {
          throw new Error('OSMD graphic initialized but staffEntries missing');
        }

        if (isMounted) {
          setOsmd(instance)
          cursorRef.current = instance.cursor
          setIsReady(true)
          setError(null)
          instance.cursor.show()
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
