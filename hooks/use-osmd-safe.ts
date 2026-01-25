'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay'

export function useOSMDSafe(musicXML: string, options?: IOSMDOptions) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)

  useEffect(() => {
    let isMounted = true

    async function initializeOSMD() {
      if (!containerRef.current || !musicXML) return

      // Always clear previous instance if musicXML changes
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

        // 3. Render the score
        osmd.render()

        // 4. Show cursor and set ready state
        if (isMounted) {
          osmd.cursor.show()
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        console.error('[OSMD] Error loading or rendering sheet music:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.')
          setIsReady(false)
        }
      }
    }

    initializeOSMD()

    return () => {
      isMounted = false
      // No need to clear here if we clear at the start of the effect
    }
  }, [musicXML, options])

  // Cleanup on unmount
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

  return {
    isReady,
    error,
    containerRef,
    resetCursor,
    advanceCursor,
  }
}
