/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */

'use client'

import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { useEffect } from 'react'
import { usePracticeShortcuts } from './use-practice-shortcuts'
import { PracticeUIEvent, PracticeStatus } from '@/lib/domain/practice'

interface LifecycleParams {
  dispatch: (event: PracticeUIEvent) => void
  onToggleZenMode: () => void
  scoreView: ScoreViewPort
  status: PracticeStatus
  currentNoteIndex: number
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const { dispatch, onToggleZenMode, scoreView, status, currentNoteIndex } = params

  // Manage keyboard shortcuts
  usePracticeShortcuts({
    status,
    dispatch,
    onToggleZenMode,
  })

  // Synchronize visual score
  useEffect(() => {
    if (scoreView.isReady) {
      scoreView.sync(currentNoteIndex)
    }
  }, [currentNoteIndex, scoreView])
}
