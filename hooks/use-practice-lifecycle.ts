/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */

'use client'

import { useEffect, useRef } from 'react'
import { allExercises } from '@/lib/exercises'
import { PracticeState } from '@/lib/practice-core'
import { Exercise } from '@/lib/domain/exercise'

interface LifecycleParams {
  practiceState: PracticeState | undefined
  loadExercise: (exercise: Exercise) => Promise<void>
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const { practiceState, loadExercise } = params
  const loadedRef = useRef(false)

  useEffect(() => {
    const shouldLoadFirst = !loadedRef.current && !practiceState && allExercises.length > 0
    if (shouldLoadFirst) {
      loadExercise(allExercises[0] as unknown as Exercise)
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])
}
