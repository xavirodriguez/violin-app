/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */

'use client'

import { PracticeState } from '@/lib/practice-core'
import { Exercise } from '@/lib/domain/exercise'
import { DerivedPracticeState } from '@/lib/practice/practice-utils'
import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { useEffect } from 'react'
import { usePracticeShortcuts } from './use-practice-shortcuts'
import { PracticeUIEvent } from '@/lib/domain/practice'

interface LifecycleParams {
  dispatch: (event: PracticeUIEvent) => void
  onToggleZenMode: () => void
  scoreView: ScoreViewPort
  derived: DerivedPracticeState
  autoStartEnabled: boolean
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const {
    dispatch,
    onToggleZenMode,
    scoreView,
    derived,
  } = params

  // Manage keyboard shortcuts
  usePracticeShortcuts({
    status: derived.status,
    dispatch,
    onToggleZenMode,
  })

  // Synchronize visual score
  useEffect(() => {
    if (scoreView.isReady) {
      scoreView.sync(derived.currentNoteIndex)
    }
  }, [derived.currentNoteIndex, scoreView])
}
