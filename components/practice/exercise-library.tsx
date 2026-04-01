'use client'

import { useMemo, useState } from 'react'
import { List, Filter } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ExerciseCard } from '@/components/exercise-card'
import { allExercises } from '@/lib/exercises'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { getRecommendedExercise } from '@/lib/exercise-recommender'
import { filterExercises } from '@/lib/exercises/utils'
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
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const { progress, sessions } = useAnalyticsStore()

  const filtered = useMemo(() => {
    return filterExercises(
      allExercises,
      { activeTab, difficulty: difficultyFilter },
      progress.exerciseStats,
    )
  }, [activeTab, difficultyFilter, progress.exerciseStats])

  const recommended = useMemo(() => {
    return getRecommendedExercise({
      exercises: filtered,
      userProgress: progress,
      lastPlayedId: sessions[0]?.exerciseId,
      difficultyFilter,
    })
  }, [filtered, progress, sessions, difficultyFilter])

  return (
    <div className="space-y-6">
      <LibraryHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        difficulty={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
      />
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

function LibraryHeader({
  activeTab,
  onTabChange,
  difficulty,
  onDifficultyChange,
}: {
  activeTab: string
  onTabChange: (v: string) => void
  difficulty: string
  onDifficultyChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h3 className="flex items-center gap-2 text-xl font-bold">
          <List className="h-5 w-5" /> Exercise Library
        </h3>
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-5 md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="beginner">Beg.</TabsTrigger>
            <TabsTrigger value="intermediate">Int.</TabsTrigger>
            <TabsTrigger value="advanced">Adv.</TabsTrigger>
            <TabsTrigger value="inProgress">Progress</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-muted/30 flex flex-wrap items-center gap-4 rounded-lg p-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" /> Filter Difficulty:
        </div>
        <ToggleGroup
          type="single"
          value={difficulty}
          onValueChange={(v) => v && onDifficultyChange(v)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="beginner">Beginner</ToggleGroupItem>
          <ToggleGroupItem value="intermediate">Intermediate</ToggleGroupItem>
          <ToggleGroupItem value="advanced">Advanced</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}

function ExerciseGrid({ exercises, selectedId, recommendedId, onSelect, stats }: any) {
  if (exercises.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed py-12 text-center">No exercises found.</div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exercises.map((ex: any) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          isRecommended={recommendedId === ex.id}
          isSelected={selectedId === ex.id}
          onClick={() => onSelect(ex)}
          lastAttempt={
            stats[ex.id]
              ? {
                  accuracy: stats[ex.id].bestAccuracy,
                  timestamp: stats[ex.id].lastPracticedMs,
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}

