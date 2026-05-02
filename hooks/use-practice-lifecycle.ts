/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */

'use client'

import { useEffect, useRef } from 'react'
import { allExercises } from '@/lib/exercises'
import { PracticeState } from '@/lib/practice-core'
import { Exercise } from '@/lib/exercises/types'
import { DerivedPracticeState } from '@/lib/practice/practice-utils'
import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { usePracticeShortcuts } from './use-practice-shortcuts'
import { usePracticeVisualSync } from './use-practice-visual-sync'

interface LifecycleParams {
  practiceState: PracticeState | undefined
  loadExercise: (exercise: Exercise) => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  setZenMode: (enabled: boolean | ((prev: boolean) => boolean)) => void
  scoreView: ScoreViewPort
  derived: DerivedPracticeState
  autoStartEnabled: boolean
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const {
    practiceState,
    loadExercise,
    start,
    stop,
    setZenMode,
    scoreView,
    derived,
  } = params
  const loadedRef = useRef(false)

  // Manage keyboard shortcuts
  usePracticeShortcuts({
    status: derived.status,
    start,
    stop,
    onToggleZenMode: () => setZenMode((prev) => !prev),
  })

  // Synchronize visual score
  usePracticeVisualSync({
    status: derived.status,
    currentNoteIndex: derived.currentNoteIndex,
    scoreView,
  })

  useEffect(() => {
    const firstExercise = allExercises[0]
    const shouldLoadFirst = !loadedRef.current && !practiceState && !!firstExercise
    if (shouldLoadFirst) {
      loadExercise(firstExercise)
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])
}
