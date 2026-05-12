'use client'

import { useEffect, useRef, useMemo } from 'react'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { Metronome } from '@/lib/metronome'

export function useMetronome(onBeat?: () => void) {
  const metronomeRef = useRef<Metronome | undefined>(undefined)

  useEffect(() => {
    const context = audioManager.getContext()
    if (context && !metronomeRef.current) {
      metronomeRef.current = new Metronome(context, onBeat)
    }

    return () => {
      metronomeRef.current?.stop()
      metronomeRef.current = undefined
    }
  }, [])

  const api = useMemo(
    () => ({
      toggle: async (bpm?: number) => {
        if (!audioManager.isActive()) {
          try {
            await audioManager.initialize()
          } catch (e) {
            console.error('[useMetronome] Failed to initialize audio:', e)
            throw e // Re-throw so caller can handle it (e.g., show toast)
          }
        }

        const context = audioManager.getContext()
        if (context) {
          if (!metronomeRef.current) {
            metronomeRef.current = new Metronome(context)
          }

          if (metronomeRef.current.isActive()) {
            metronomeRef.current.stop()
          } else {
            if (bpm) metronomeRef.current.setBpm(bpm)
            metronomeRef.current.start()
          }
        }
      },
      setBpm: (bpm: number) => {
        metronomeRef.current?.setBpm(bpm)
      },
      isActive: () => metronomeRef.current?.isActive() ?? false,
    }),
    [],
  )

  return api
}
