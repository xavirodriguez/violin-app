'use client'

import { useEffect, useRef } from 'react'
import { usePracticeStore } from '@/lib/stores/practice-store'
import { allExercises } from '@/lib/exercises'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Play, Square, RotateCcw, Trophy, AlertCircle } from 'lucide-react'
import { SheetMusic } from '@/components/sheet-music'
import { ErrorBoundary } from '@/components/error-boundary'
import { PracticeFeedback } from '@/components/practice-feedback'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'

export function PracticeMode() {
  const {
    practiceState,
    error,
    currentNoteIndex,
    targetNote,
    status,
    loadExercise,
    start,
    stop,
    reset,
  } = usePracticeStore()

  const loadedRef = useRef(false)
  const osmdHook = useOSMDSafe(practiceState?.exercise.musicXML ?? '')

  // Load default exercise on mount
  useEffect(() => {
    if (!loadedRef.current && !practiceState) {
      loadExercise(allExercises[0])
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])

  const handleExerciseChange = (exerciseId: string) => {
    const selectedExercise = allExercises.find((ex) => ex.id === exerciseId)
    if (selectedExercise) {
      loadExercise(selectedExercise)
    }
  }

  // OSMD Cursor Synchronization Effect
  useEffect(() => {
    if (!osmdHook.isReady) return

    if (currentNoteIndex === 0) {
      osmdHook.resetCursor()
    } else {
      osmdHook.advanceCursor()
    }
  }, [currentNoteIndex, osmdHook.isReady])

  const totalNotes = practiceState?.exercise.notes.length || 0
  const progress =
    totalNotes > 0 ? ((currentNoteIndex + (status === 'completed' ? 1 : 0)) / totalNotes) * 100 : 0
  const lastDetectedNote =
    practiceState?.detectionHistory[practiceState.detectionHistory.length - 1]

  // Construct the full target note name for display
  const targetPitchName = targetNote
    ? `${targetNote.pitch.step}${targetNote.pitch.alter ?? ''}${targetNote.pitch.octave}`
    : ''

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-foreground mb-2 text-3xl font-bold">
            {practiceState?.exercise.name}
          </h2>
          <p className="text-muted-foreground">Play each note in tune to advance.</p>
        </div>

        <Card className="p-4">
          <Select
            value={practiceState?.exercise.id}
            onValueChange={handleExerciseChange}
            disabled={status !== 'idle'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an exercise" />
            </SelectTrigger>
            <SelectContent>
              {allExercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {error && (
          <Card className="bg-destructive/10 border-destructive p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-destructive h-6 w-6" />
              <div className="flex-1">
                <h3 className="text-destructive font-semibold">Error</h3>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
              <Button onClick={reset} variant="outline">
                Reset
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {status === 'idle' && (
                <Button onClick={start} size="lg" className="gap-2" disabled={!practiceState}>
                  <Play className="h-4 w-4" /> Start Practice
                </Button>
              )}
              {status === 'listening' && (
                <Button onClick={stop} size="lg" variant="destructive" className="gap-2">
                  <Square className="h-4 w-4" /> Stop
                </Button>
              )}
              {status === 'completed' && (
                <Button
                  onClick={() => practiceState && loadExercise(practiceState.exercise)}
                  size="lg"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Practice Again
                </Button>
              )}
            </div>
            {practiceState && (
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-sm">
                  Note {Math.min(currentNoteIndex + 1, totalNotes)} of {totalNotes}
                </div>
                <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {practiceState?.exercise.musicXML && (
          <Card className="p-6">
            <ErrorBoundary fallback={<div>Failed to load sheet music</div>}>
              <SheetMusic
                containerRef={osmdHook.containerRef as React.RefObject<HTMLDivElement>}
                isReady={osmdHook.isReady}
                error={osmdHook.error}
              />
            </ErrorBoundary>
          </Card>
        )}

        {status === 'listening' && targetNote && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <PracticeFeedback
                targetNote={targetPitchName}
                detectedPitchName={lastDetectedNote?.pitch}
                centsOff={lastDetectedNote?.cents}
                status={status}
              />
            </Card>
            <Card className="p-6">
              <ViolinFingerboard
                targetNote={targetPitchName}
                detectedPitchName={lastDetectedNote?.pitch}
                centsDeviation={lastDetectedNote?.cents}
              />
            </Card>
          </div>
        )}

        {status === 'completed' && (
          <Card className="bg-primary/10 p-8 text-center">
            <Trophy className="text-primary mx-auto mb-4 h-20 w-20" />
            <h3 className="mb-2 text-2xl font-bold">🎉 Exercise Complete!</h3>
            <p className="text-muted-foreground mb-6">Excellent work!</p>
            <Button
              onClick={() => practiceState && loadExercise(practiceState.exercise)}
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Practice Again
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
