'use client'

import { useEffect } from 'react'

interface UsePracticeShortcutsParams {
  status: string
  start: () => void
  stop: () => void
  onToggleZenMode: () => void
}

/**
 * Hook to manage keyboard shortcuts for the practice session.
 */
export function usePracticeShortcuts(params: UsePracticeShortcutsParams) {
  const { status, start, stop, onToggleZenMode } = params

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z') {
        onToggleZenMode()
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
  }, [status, start, stop, onToggleZenMode])
}
