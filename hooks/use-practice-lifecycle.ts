/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */

'use client'

import { useEffect, useRef } from 'react'
import { allExercises } from '@/lib/exercises'
import { usePracticeUIEffects } from './use-practice-ui-effects'
import { PracticeState } from '@/lib/practice-core'
import { ScoreViewPort } from '@/lib/infrastructure/osmd/scoreViewPort'
import { Exercise } from '@/lib/exercises/types'
import { DerivedPracticeState } from '@/lib/practice/practice-utils'

interface LifecycleParams {
  practiceState: PracticeState | undefined
  loadExercise: (exercise: Exercise) => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  onToggleZenMode: () => void
  scoreView: ScoreViewPort
  derived: DerivedPracticeState
  autoStartEnabled: boolean
  lastLoadedAt: number
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const {
    practiceState,
    loadExercise,
    start,
    stop,
    onToggleZenMode,
    scoreView,
    derived,
    autoStartEnabled,
    lastLoadedAt,
  } = params
  const loadedRef = useRef(false)
  const lastAutoStartTimestamp = useRef<number>(lastLoadedAt)

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

  const hasPracticeState = !!practiceState

  useEffect(() => {
    const isNewLoad = lastLoadedAt !== lastAutoStartTimestamp.current
    const shouldAutoStart =
      autoStartEnabled && hasPracticeState && derived.status === 'idle' && isNewLoad

    if (shouldAutoStart) {
      lastAutoStartTimestamp.current = lastLoadedAt
      start()
    }
  }, [autoStartEnabled, hasPracticeState, derived.status, start, lastLoadedAt])
}
