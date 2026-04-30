/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */

'use client'

import { useEffect, useRef } from 'react'
import { allExercises } from '@/lib/exercises'
import { usePracticeUIEffects } from './use-practice-ui-effects'
<<<<<<< HEAD
import { PracticeState } from '@/lib/domain/practice'
=======
import { PracticeState } from '@/lib/practice-core'
>>>>>>> main
import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { Exercise } from '@/lib/domain/exercise'
import { DerivedPracticeState } from '@/lib/practice/practice-utils'

interface LifecycleParams {
  practiceState: PracticeState | undefined
  loadExercise: (exercise: Exercise) => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  onToggleZenMode: () => void
  scoreView: ScoreViewPort
  derived: DerivedPracticeState
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const { practiceState, loadExercise, start, stop, onToggleZenMode, scoreView, derived } = params
  const loadedRef = useRef(false)

  usePracticeUIEffects({
    status: derived.status,
    currentNoteIndex: derived.currentNoteIndex,
    start,
    stop,
    onToggleZenMode,
    scoreView,
  })

  useEffect(() => {
    const shouldLoadFirst = !loadedRef.current && !practiceState && allExercises.length > 0
    if (shouldLoadFirst) {
      loadExercise(allExercises[0] as unknown as Exercise)
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])
}
