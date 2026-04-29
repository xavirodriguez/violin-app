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
import { useOSMDSafe } from './use-osmd-safe'
import { Exercise } from '@/lib/exercises/types'
import { DerivedPracticeState } from '@/lib/practice/practice-utils'

interface LifecycleParams {
  practiceState: PracticeState | undefined
  loadExercise: (exercise: Exercise) => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  setIsZen: (enabled: boolean | ((prev: boolean) => boolean)) => void
  osmdHook: ReturnType<typeof useOSMDSafe>
  derived: DerivedPracticeState
  autoStartEnabled: boolean
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const {
    practiceState,
    loadExercise,
    start,
    stop,
    setIsZen,
    osmdHook,
    derived,
    autoStartEnabled,
  } = params
  const loadedRef = useRef(false)
  const lastPracticeStateRef = useRef<PracticeState | undefined>(practiceState)

  usePracticeUIEffects({
    status: derived.status,
    currentNoteIndex: derived.currentNoteIndex,
    start,
    stop,
    setZenMode: setIsZen,
    osmdHook,
  })

  useEffect(() => {
    const shouldLoadFirst = !loadedRef.current && !practiceState && allExercises.length > 0
    if (shouldLoadFirst) {
      loadExercise(allExercises[0] as unknown as Exercise)
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])

  useEffect(() => {
    const isNewLoad = practiceState !== lastPracticeStateRef.current
    const shouldAutoStart =
      autoStartEnabled && practiceState && derived.status === 'idle' && isNewLoad

    if (shouldAutoStart) {
      lastPracticeStateRef.current = practiceState
      start()
    }
  }, [autoStartEnabled, practiceState, derived.status, start])
}
