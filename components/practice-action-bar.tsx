/**
 * PracticeActionBar
 * A comprehensive top bar that contains all practice controls, progress indicators,
 * and exercise selection in a single, always-visible interface.
 */

'use client'

import { Play, Square, RotateCcw, Music, Clock, Flame, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/lib/exercises'

interface PracticeActionBarProps {
  /** List of all available exercises */
  exercises: Exercise[]
  /** Currently selected exercise ID */
  selectedExerciseId?: string
  /** Callback when an exercise is selected */
  onSelectExercise: (exerciseId: string) => void
  /** Current practice status */
  status: 'idle' | 'listening' | 'validating' | 'completed'
  /** Current note index (0-based) */
  currentNoteIndex: number
  /** Total number of notes in exercise */
  totalNotes: number
  /** Progress percentage (0-100) */
  progress: number
  /** Callback to start practice */
  onStart: () => void
  /** Callback to stop practice */
  onStop: () => void
  /** Callback to restart practice */
  onRestart: () => void
  /** Current session duration in seconds */
  sessionDuration?: number
  /** Current streak of correct notes */
  currentStreak?: number
}

/**
 * Formats seconds into MM:SS format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function ExerciseSelector({
  exercises,
  selectedExerciseId,
  onSelectExercise,
  disabled,
}: {
  exercises: Exercise[]
  selectedExerciseId?: string
  onSelectExercise: (id: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <Music className="text-primary hidden h-5 w-5 sm:block" />
      <Select value={selectedExerciseId} onValueChange={onSelectExercise} disabled={disabled}>
        <SelectTrigger className="w-[200px] sm:w-[280px]">
          <SelectValue placeholder="Select an exercise" />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((exercise) => (
            <SelectItem key={exercise.id} value={exercise.id}>
              {exercise.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PracticeStats({
  currentNoteIndex,
  totalNotes,
  sessionDuration,
  currentStreak,
}: {
  currentNoteIndex: number
  totalNotes: number
  sessionDuration: number
  currentStreak: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2">
        <Target className="text-muted-foreground h-4 w-4" />
        <span className="text-sm font-medium">
          {Math.min(currentNoteIndex + 1, totalNotes)}/{totalNotes}
        </span>
      </div>

      {sessionDuration > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground h-4 w-4" />
          <span className="font-mono text-sm font-medium">{formatDuration(sessionDuration)}</span>
        </div>
      )}

      {currentStreak > 0 && (
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-500">{currentStreak}</span>
        </div>
      )}
    </div>
  )
}

function ActionButtons({
  status,
  hasExercise,
  onStart,
  onStop,
  onRestart,
}: {
  status: 'idle' | 'listening' | 'validating' | 'completed'
  hasExercise: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
}) {
  const isIdle = status === 'idle'
  const isActive = status === 'listening' || status === 'validating'
  const isCompleted = status === 'completed'

  return (
    <div className="flex items-center gap-2">
      {isIdle && (
        <Button onClick={onStart} size="default" className="gap-2" disabled={!hasExercise}>
          <Play className="h-4 w-4" />
          <span className="hidden sm:inline">Start</span>
        </Button>
      )}

      {isActive && (
        <Button onClick={onStop} size="default" variant="destructive" className="gap-2">
          <Square className="h-4 w-4" />
          <span className="hidden sm:inline">Stop</span>
        </Button>
      )}

      {isCompleted && (
        <Button onClick={onRestart} size="default" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Restart</span>
        </Button>
      )}
    </div>
  )
}

/**
 * A unified top action bar that displays progress, controls, and exercise selection.
 * Designed to be always visible and provide quick access to all practice functions.
 */
export function PracticeActionBar({
  exercises,
  selectedExerciseId,
  onSelectExercise,
  status,
  currentNoteIndex,
  totalNotes,
  progress,
  onStart,
  onStop,
  onRestart,
  sessionDuration = 0,
  currentStreak = 0,
}: PracticeActionBarProps) {
  const isActive = status === 'listening' || status === 'validating'
  const hasExercise = !!selectedExerciseId

  return (
    <div className="border-border bg-card sticky top-0 z-30 border-b shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ExerciseSelector
            exercises={exercises}
            selectedExerciseId={selectedExerciseId}
            onSelectExercise={onSelectExercise}
            disabled={isActive}
          />

          {hasExercise && (
            <PracticeStats
              currentNoteIndex={currentNoteIndex}
              totalNotes={totalNotes}
              sessionDuration={sessionDuration}
              currentStreak={currentStreak}
            />
          )}

          <ActionButtons
            status={status}
            hasExercise={hasExercise}
            onStart={onStart}
            onStop={onStop}
            onRestart={onRestart}
          />
        </div>
      </div>

      {hasExercise && (
        <div className="relative h-1">
          <Progress value={progress} className="h-full rounded-none" />
        </div>
      )}

      {isActive && (
        <div
          className={cn(
            'h-0.5 transition-colors duration-300',
            status === 'listening' && 'bg-blue-500',
            status === 'validating' && 'bg-yellow-500',
          )}
        />
      )}
    </div>
  )
}
