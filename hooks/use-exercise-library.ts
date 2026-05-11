'use client'

import { useMemo, useState } from 'react'
import { allExercises } from '@/lib/exercises'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { getRecommendedExercise } from '@/lib/exercise-recommender'
import { filterExercises } from '@/lib/exercises/utils'

/**
 * Custom hook to manage the state and logic of the Exercise Library.
 */
export function useExerciseLibrary() {
  const [activeTab, setActiveTab] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const { progress, sessions } = useAnalyticsStore()

  const filtered = useMemo(() => {
    const stats = progress.exerciseStats
    return filterExercises({
      exercises: allExercises,
      filter: { activeTab, difficulty: difficultyFilter },
      stats,
    })
  }, [activeTab, difficultyFilter, progress.exerciseStats])

  const recommended = useMemo(() => {
    const lastPlayedId = sessions[0]?.exerciseId
    return getRecommendedExercise({
      exercises: filtered,
      userProgress: progress,
      lastPlayedId,
      difficultyFilter,
    })
  }, [filtered, progress, sessions, difficultyFilter])

  return {
    activeTab,
    setActiveTab,
    difficultyFilter,
    setDifficultyFilter,
    filtered,
    recommended,
    exerciseStats: progress.exerciseStats,
  }
}
