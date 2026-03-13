'use client'

import { Play, Square, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Control bar for starting, stopping, and monitoring practice progress.
 */
export function PracticeControls({
  status,
  hasExercise,
  onStart,
  onStop,
  onRestart,
  progress,
  currentNoteIndex,
  totalNotes,
}: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <SessionActions
          status={status}
          disabled={!hasExercise}
          onStart={onStart}
          onStop={onStop}
          onRestart={onRestart}
        />
        {hasExercise && (
          <ProgressBar index={currentNoteIndex} total={totalNotes} progress={progress} />
        )}
      </div>
    </Card>
  )
}

function SessionActions({ status, disabled, onStart, onStop, onRestart }: any) {
  if (status === 'listening') {
    return (
      <Button onClick={onStop} size="lg" variant="destructive" className="gap-2">
        <Square className="h-4 w-4" /> Stop
      </Button>
    )
  }
  if (status === 'completed') {
    return (
      <Button onClick={onRestart} size="lg" className="gap-2">
        <RotateCcw className="h-4 w-4" /> Practice Again
      </Button>
    )
  }
  return (
    <Button onClick={onStart} size="lg" className="gap-2" disabled={disabled}>
      <Play className="h-4 w-4" /> Start Practice
    </Button>
  )
}

function ProgressBar({ index, total, progress }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-muted-foreground text-sm">
        Note {Math.min(index + 1, total)} of {total}
      </div>
      <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
