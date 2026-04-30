'use client'

import { useEffect } from 'react'
import { ScoreViewPort } from '@/lib/ports/score-view.port'

interface UsePracticeVisualSyncParams {
  status: string
  currentNoteIndex: number
  scoreView: ScoreViewPort
}

/**
 * Hook to synchronize the sheet music cursor and highlighting with the current practice note.
 */
export function usePracticeVisualSync(params: UsePracticeVisualSyncParams) {
  const { status, currentNoteIndex, scoreView } = params

  useEffect(() => {
    if (!scoreView.isReady) return

    const activeStatuses = ['listening', 'validating', 'correct']
    if (activeStatuses.includes(status)) {
      scoreView.sync(currentNoteIndex)
    }
  }, [currentNoteIndex, status, scoreView])
}
