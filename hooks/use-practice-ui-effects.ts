'use client'

import { useEffect } from 'react'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'

/**
 * Custom hook to manage keyboard shortcuts and cursor synchronization for the practice session.
 *
 * @param params - Hook dependencies including state and actions.
 */
export function usePracticeUIEffects(params: {
  status: string
  currentNoteIndex: number
  start: () => void
  stop: () => void
  setZenMode: (v: (prev: boolean) => boolean) => void
  osmdHook: ReturnType<typeof useOSMDSafe>
}) {
  const { status, currentNoteIndex, start, stop, setZenMode, osmdHook } = params

  /**
   * Effect to sync the OSMD cursor and highlighting whenever the current note changes.
   */
  useEffect(() => {
    syncCursorWithNote({ osmdHook, status, currentNoteIndex })
  }, [currentNoteIndex, status, osmdHook])

  /**
   * Keyboard shortcuts effect.
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z') {
        setZenMode((v) => !v)
        return
      }

      if (status === 'idle') return

      if (e.key.toLowerCase() === ' ') {
        e.preventDefault()
        if (status === 'listening') {
          stop()
        } else {
          start()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [status, start, stop, setZenMode])
}

/**
 * Synchronizes the sheet music cursor and highlighting with the current practice note.
 */
function syncCursorWithNote(params: {
  osmdHook: ReturnType<typeof useOSMDSafe>
  status: string
  currentNoteIndex: number
}) {
  const { osmdHook, status, currentNoteIndex } = params
  if (!osmdHook.isReady) return

  const activeStatuses = ['listening', 'validating', 'correct']
  if (activeStatuses.includes(status)) {
    updateCursorState(osmdHook, currentNoteIndex)
    scrollToCurrentNote(osmdHook)
    osmdHook.highlightCurrentNote(currentNoteIndex)
  }
}

/**
 * Resets or advances the OSMD cursor based on the note index.
 */
function updateCursorState(osmdHook: ReturnType<typeof useOSMDSafe>, currentNoteIndex: number) {
  if (currentNoteIndex === 0) {
    osmdHook.resetCursor()
  } else {
    osmdHook.advanceCursor()
  }
}

/**
 * Performs smooth auto-scrolling to keep the current note centered in view.
 */
function scrollToCurrentNote(osmdHook: ReturnType<typeof useOSMDSafe>) {
  const cursorElement = osmdHook.containerRef.current?.querySelector('.osmd-cursor')
  if (cursorElement) {
    cursorElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  }
}
