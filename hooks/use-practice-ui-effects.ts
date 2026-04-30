'use client'

import { useEffect } from 'react'
import { ScoreViewPort } from '@/lib/ports/score-view.port'

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
  onToggleZenMode: () => void
  scoreView: ScoreViewPort
}) {
  const { status, currentNoteIndex, start, stop, onToggleZenMode, scoreView } = params

  /**
   * Effect to sync the OSMD cursor and highlighting whenever the current note changes.
   */
  useEffect(() => {
    syncCursorWithNote({ scoreView, status, currentNoteIndex })
  }, [currentNoteIndex, status, scoreView])

  /**
   * Keyboard shortcuts effect.
   */
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

/**
 * Synchronizes the sheet music cursor and highlighting with the current practice note.
 */
function syncCursorWithNote(params: {
  scoreView: ScoreViewPort
  status: string
  currentNoteIndex: number
}) {
  const { scoreView, status, currentNoteIndex } = params
  if (!scoreView.isReady) return

  const activeStatuses = ['listening', 'validating', 'correct']
  if (activeStatuses.includes(status)) {
    scoreView.sync(currentNoteIndex)
  }
}
