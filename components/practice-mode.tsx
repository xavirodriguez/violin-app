/**
 * PracticeMode
 * The main container component for the interactive practice session.
 * It orchestrates exercise selection, audio processing, sheet music rendering,
 * and real-time feedback.
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePracticeStore } from '@/stores/practice-store'
import { allExercises } from '@/lib/exercises'
import { type TargetNote, type DetectedNote, formatPitchName } from '@/lib/practice-core'
import { type Observation } from '@/lib/technique-types'
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

function PracticeHeader({ exerciseName }: { exerciseName?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-foreground mb-2 text-3xl font-bold">{exerciseName}</h2>
      <p className="text-muted-foreground">Play each note in tune to advance.</p>
    </div>
  )
}

function ExerciseSelector({
  value,
  onValueChange,
  disabled,
}: {
  value?: string
  onValueChange: (val: string) => void
  disabled: boolean
}) {
  return (
    <Card className="p-4">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
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
  )
}

function ErrorDisplay({ error, onReset }: { error: string; onReset: () => void }) {
  return (
    <Card className="bg-destructive/10 border-destructive p-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="text-destructive h-6 w-6" />
        <div className="flex-1">
          <h3 className="text-destructive font-semibold">Error</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        <Button onClick={onReset} variant="outline">
          Reset
        </Button>
      </div>
    </Card>
  )
}

function PracticeControls({
  status,
  hasExercise,
  onStart,
  onStop,
  onRestart,
  progress,
  currentNoteIndex,
  totalNotes,
}: {
  status: string
  hasExercise: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  progress: number
  currentNoteIndex: number
  totalNotes: number
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {status === 'idle' && (
            <Button onClick={onStart} size="lg" className="gap-2" disabled={!hasExercise}>
              <Play className="h-4 w-4" /> Start Practice
            </Button>
          )}
          {status === 'listening' && (
            <Button onClick={onStop} size="lg" variant="destructive" className="gap-2">
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}
          {status === 'completed' && (
            <Button onClick={onRestart} size="lg" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Practice Again
            </Button>
          )}
        </div>
        {hasExercise && (
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
  )
}

function PracticeCompletion({ onRestart }: { onRestart: () => void }) {
  return (
    <Card className="bg-primary/10 p-8 text-center">
      <Trophy className="text-primary mx-auto mb-4 h-20 w-20" />
      <h3 className="mb-2 text-2xl font-bold">🎉 Exercise Complete!</h3>
      <p className="text-muted-foreground mb-6">Excellent work!</p>
      <Button onClick={onRestart} size="lg" className="gap-2">
        <RotateCcw className="h-4 w-4" /> Practice Again
      </Button>
    </Card>
  )
}

function PracticeActiveView({
  status,
  targetNote,
  targetPitchName,
  lastDetectedNote,
  holdDuration,
  lastObservations,
}: {
  status: string
  targetNote: TargetNote | null
  targetPitchName: string | null
  lastDetectedNote: DetectedNote | null | undefined
  holdDuration?: number
  lastObservations?: Observation[]
}) {
  if (status !== 'listening' || !targetNote) return null

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <PracticeFeedback
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch ?? null}
          centsOff={lastDetectedNote?.cents ?? null}
          status={status}
          holdDuration={holdDuration}
          observations={lastObservations}
        />
      </Card>
      <Card className="p-6">
        <ViolinFingerboard
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch ?? null}
          centsDeviation={lastDetectedNote?.cents ?? null}
        />
      </Card>
    </div>
  )
}

function SheetMusicView({
  musicXML,
  isReady,
  error,
  containerRef,
}: {
  musicXML?: string
  isReady: boolean
  error: string | null
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  if (!musicXML) return null

  return (
    <Card className="p-6">
      <ErrorBoundary fallback={<div>Failed to load sheet music</div>}>
        <SheetMusic containerRef={containerRef} isReady={isReady} error={error} />
      </ErrorBoundary>
    </Card>
  )
}

/**
 * Computes derived values from the practice state to keep the main component simple.
 * @internal
 */
function derivePracticeState(practiceState: import('@/lib/practice-core').PracticeState | null) {
  const status = practiceState?.status ?? 'idle'
  const currentNoteIndex = practiceState?.currentIndex ?? 0
  const targetNote = practiceState?.exercise.notes[currentNoteIndex] ?? null
  const totalNotes = practiceState?.exercise.notes.length ?? 0
  const isCompleted = status === 'completed'
  const progress =
    totalNotes > 0 ? ((currentNoteIndex + (isCompleted ? 1 : 0)) / totalNotes) * 100 : 0

  const history = practiceState?.detectionHistory ?? []
  const lastDetectedNote = history.length > 0 ? history[history.length - 1] : null
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : null

  return {
    status,
    currentNoteIndex,
    targetNote,
    totalNotes,
    isCompleted,
    progress,
    lastDetectedNote,
    targetPitchName,
  }
}

/**
 * Renders the practice interface and manages its complex lifecycle.
 *
 * @remarks
 * State flow:
 * - `idle`: Shows exercise selector and "Start" button.
 * - `listening`: Audio loop is active, providing real-time feedback.
 * - `completed`: Shows success state and option to restart.
 */
export function PracticeMode() {
  const { practiceState, error, loadExercise, start, stop, reset } = usePracticeStore()
  const derived = derivePracticeState(practiceState)

  const loadedRef = useRef(false)
  const osmdHook = useOSMDSafe(practiceState?.exercise.musicXML ?? '')

  useEffect(() => {
    if (!loadedRef.current && !practiceState) {
      loadExercise(allExercises[0])
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])

  useEffect(() => {
    if (!osmdHook.isReady) return
    const { status, currentNoteIndex } = derived
    if (status === 'listening' && currentNoteIndex === 0) {
      osmdHook.resetCursor()
    } else if (status === 'listening' && currentNoteIndex > 0) {
      osmdHook.advanceCursor()
    }
  }, [derived.currentNoteIndex, derived.status, osmdHook.isReady])

  const handleRestart = () => practiceState && loadExercise(practiceState.exercise)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <PracticeHeader exerciseName={practiceState?.exercise.name} />

        <ExerciseSelector
          value={practiceState?.exercise.id}
          onValueChange={(id) => {
            const exercise = allExercises.find((ex) => ex.id === id)
            if (exercise) loadExercise(exercise)
          }}
          disabled={status !== 'idle'}
        />

        {error && <ErrorDisplay error={error.message} onReset={reset} />}

        <PracticeControls
          status={derived.status}
          hasExercise={!!practiceState}
          onStart={start}
          onStop={stop}
          onRestart={handleRestart}
          progress={derived.progress}
          currentNoteIndex={derived.currentNoteIndex}
          totalNotes={derived.totalNotes}
        />

        <SheetMusicView
          musicXML={practiceState?.exercise.musicXML}
          isReady={osmdHook.isReady}
          error={osmdHook.error}
          containerRef={osmdHook.containerRef}
        />

        <PracticeActiveView
          status={derived.status}
          targetNote={derived.targetNote}
          targetPitchName={derived.targetPitchName}
          lastDetectedNote={derived.lastDetectedNote}
          holdDuration={practiceState?.holdDuration}
          lastObservations={practiceState?.lastObservations}
        />

        {derived.isCompleted && <PracticeCompletion onRestart={handleRestart} />}
      </div>
    </div>
  )
}
