'use client'

import { List, Filter } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExerciseCard } from '@/components/exercise-card'
import { useExerciseLibrary } from '@/hooks/use-exercise-library'
import type { Exercise } from '@/lib/domain/exercise'
import { ExerciseStats } from '@/lib/domain/practice'

interface ExerciseLibraryProps {
  selectedId?: string
  onSelect: (exercise: Exercise) => void
  disabled: boolean
}

/**
 * Library component for browsing and selecting exercises.
 */
export function ExerciseLibrary(props: ExerciseLibraryProps) {
  const { selectedId, onSelect } = props
  const library = useExerciseLibrary()

  return (
    <div className="space-y-6">
      <LibraryHeader
        activeTab={library.activeTab}
        onTabChange={library.setActiveTab}
        difficulty={library.difficultyFilter}
        onDifficultyChange={library.setDifficultyFilter}
      />
      <ExerciseGrid
        exercises={library.filtered}
        selectedId={selectedId}
        recommendedId={library.recommended?.id}
        recommendationReason={library.recommended?.recommendationReason}
        onSelect={onSelect}
        stats={library.exerciseStats}
      />
    </div>
  )
}

interface LibraryHeaderProps {
  activeTab: string
  onTabChange: (v: string) => void
  difficulty: string
  onDifficultyChange: (v: string) => void
}

function LibraryHeader(props: LibraryHeaderProps) {
  const { activeTab, onTabChange, difficulty, onDifficultyChange } = props
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h3 className="flex items-center gap-2 text-xl font-bold">
          <List className="h-5 w-5" /> Exercise Library
        </h3>
        <ModeTabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      <DifficultyToggle difficulty={difficulty} onDifficultyChange={onDifficultyChange} />
    </div>
  )
}

function ModeTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (v: string) => void
}) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full md:w-auto">
      <TabsList className="grid w-full grid-cols-5 md:w-auto">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="beginner">Beg.</TabsTrigger>
        <TabsTrigger value="intermediate">Int.</TabsTrigger>
        <TabsTrigger value="advanced">Adv.</TabsTrigger>
        <TabsTrigger value="inProgress">Progress</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function DifficultyToggle({
  difficulty,
  onDifficultyChange,
}: {
  difficulty: string
  onDifficultyChange: (v: string) => void
}) {
  return (
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
  )
}

interface ExerciseGridProps {
  exercises: Exercise[]
  selectedId?: string
  recommendedId?: string
  recommendationReason?: string
  onSelect: (exercise: Exercise) => void
  stats: Record<string, ExerciseStats>
}

function ExerciseGrid(props: ExerciseGridProps) {
  const { exercises, selectedId, recommendedId, recommendationReason, onSelect, stats } = props
  if (exercises.length === 0) {
    return (
      <Card className="rounded-xl border-2 border-dashed py-12 text-center bg-muted/10">
         <List className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
         <p className="text-muted-foreground font-medium">No exercises found matching your filters.</p>
         <Button variant="link" size="sm" className="mt-2" onClick={() => window.location.reload()}>
           Clear all filters
         </Button>
      </Card>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exercises.map((ex) => (
        <LibraryCard
          key={ex.id}
          exercise={ex}
          isRecommended={recommendedId === ex.id}
          isSelected={selectedId === ex.id}
          onSelect={onSelect}
          stats={stats[ex.id]}
        />
      ))}
    </div>
  )
}

function LibraryCard(props: {
  exercise: Exercise
  isRecommended: boolean
  recommendationReason?: string
  isSelected: boolean
  onSelect: (ex: Exercise) => void
  stats?: ExerciseStats
}) {
  const { exercise, isRecommended, recommendationReason, isSelected, onSelect, stats } = props
  const lastAttempt = stats
    ? { accuracy: stats.bestAccuracy, timestamp: stats.lastPracticedMs }
    : undefined

  return (
    <ExerciseCard
      exercise={exercise}
      isRecommended={isRecommended}
      recommendationReason={recommendationReason}
      isSelected={isSelected}
      onClick={() => onSelect(exercise)}
      lastAttempt={lastAttempt}
    />
  )
}
