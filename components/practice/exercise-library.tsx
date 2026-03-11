'use client'

import { useMemo, useState } from 'react'
import { List } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExerciseCard } from '@/components/exercise-card'
import { allExercises } from '@/lib/exercises'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { getRecommendedExercise } from '@/lib/exercise-recommender'
import type { Exercise } from '@/lib/domain/musical-types'

/**
 * Library component for browsing and selecting exercises.
 */
export function ExerciseLibrary({
  selectedId,
  onSelect,
}: {
  selectedId?: string
  onSelect: (exercise: Exercise) => void
  disabled: boolean
}) {
  const [activeTab, setActiveTab] = useState('all')
  const { progress, sessions } = useAnalyticsStore()

  const recommended = useMemo(() => {
    return getRecommendedExercise({
      exercises: allExercises,
      userProgress: progress,
      lastPlayedId: sessions[0]?.exerciseId,
    })
  }, [progress, sessions])

  const filtered = useMemo(() => {
    return filterExercises(allExercises, activeTab, progress.exerciseStats)
  }, [activeTab, progress.exerciseStats])

  return (
    <div className="space-y-6">
      <LibraryHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <ExerciseGrid
        exercises={filtered}
        selectedId={selectedId}
        recommendedId={recommended?.id}
        onSelect={onSelect}
        stats={progress.exerciseStats}
      />
    </div>
  )
}

function LibraryHeader({ activeTab, onTabChange }: { activeTab: string; onTabChange: (v: string) => void }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <List className="h-5 w-5" /> Exercise Library
      </h3>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full md:w-auto">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="beginner">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate">Int.</TabsTrigger>
          <TabsTrigger value="inProgress">In Progress</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

function ExerciseGrid({ exercises, selectedId, recommendedId, onSelect, stats }: any) {
  if (exercises.length === 0) {
    return <div className="text-center py-12 border-2 border-dashed rounded-xl">No exercises found.</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map((ex: any) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          isRecommended={recommendedId === ex.id}
          isSelected={selectedId === ex.id}
          onClick={() => onSelect(ex)}
          lastAttempt={stats[ex.id] ? {
            accuracy: stats[ex.id].bestAccuracy,
            timestamp: stats[ex.id].lastPracticedMs
          } : undefined}
        />
      ))}
    </div>
  )
}

function filterExercises(exercises: Exercise[], tab: string, stats: any) {
  return exercises.filter((ex) => {
    if (tab === 'all') return true
    if (tab === 'beginner') return ex.difficulty === 'Beginner'
    if (tab === 'intermediate') return ex.difficulty === 'Intermediate'
    if (tab === 'inProgress') return stats[ex.id]?.timesCompleted > 0 && stats[ex.id]?.bestAccuracy < 100
    return true
  })
}
