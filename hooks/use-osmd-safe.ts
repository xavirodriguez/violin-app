'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { OpenSheetMusicDisplay, Cursor } from 'opensheetmusicdisplay'

export function useOSMDSafe(musicXML: string) {
  const [osmd, setOsmd] = useState<OpenSheetMusicDisplay | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<Cursor | null>(null)
  const initializedRef = useRef(false) // Ref to prevent double initialization in Strict Mode

  useEffect(() => {
    if (initializedRef.current || !containerRef.current || !musicXML) return

    let instance: OpenSheetMusicDisplay | null = null

    async function initializeOSMD() {
      try {
        instance = new OpenSheetMusicDisplay(containerRef.current!, {
          autoResize: true,
          backend: 'svg',
          drawTitle: false,
          followCursor: true,
          disableCursor: false,
        })
        osmdRef.current = instance
        setOsmd(instance)

        await instance.load(musicXML)

        // Defensive guard against race conditions in React StrictMode
        if (!instance.IsReadyToRender) {
          console.warn('[OSMD] Render skipped: instance not ready, likely due to Strict Mode.')
          return
        }

        instance.render()

        // Wait for next tick to ensure DOM is updated
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (isMountedRef.current) {
          instance.cursor.show()
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        console.error('[OSMD] Initialization error:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load sheet music')
          setIsReady(false)
        }
      }
    }

    initializeOSMD()
    initializedRef.current = true

    return () => {
      osmdRef.current?.clear()
      osmdRef.current = null
      setOsmd(null)
      setIsReady(false)
    }
  }, [musicXML])

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

  return {
    osmd,
    isReady,
    error,
    containerRef,
    resetCursor,
    advanceCursor,
  }
}
