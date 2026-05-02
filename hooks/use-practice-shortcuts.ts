'use client'

import { useEffect } from 'react'
import { PracticeUIEvent } from '@/lib/domain/practice'

interface UsePracticeShortcutsParams {
  status: string
  dispatch: (event: PracticeUIEvent) => void
  onToggleZenMode: () => void
}

/**
 * Hook to manage keyboard shortcuts for the practice session.
 */
export function usePracticeShortcuts(params: UsePracticeShortcutsParams) {
  const { status, dispatch, onToggleZenMode } = params

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
          dispatch({ type: 'STOP_SESSION' })
        } else {
          dispatch({ type: 'START_SESSION' })
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [status, dispatch, onToggleZenMode])
}
