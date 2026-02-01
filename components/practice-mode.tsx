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
import {
  type TargetNote,
  type DetectedNote,
  formatPitchName,
} from '@/lib/practice-core'
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
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'

const DEFAULT_CENTS_TOLERANCE = 25

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  liveObservations,
}: {
  status: string
  targetNote: TargetNote | null
  targetPitchName: string | null
  lastDetectedNote: DetectedNote | null | undefined
  liveObservations: Observation[]
}) {
  const isActive = status === 'listening' || status === 'validating' || status === 'correct'
  if (!isActive || !targetNote || !targetPitchName) return null

  return (
    <>
      <Card className="p-12">
        <PracticeFeedback
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch}
          centsOff={lastDetectedNote?.cents ?? null}
          status={status}
          liveObservations={liveObservations}
        />
      </Card>
      <Card className="p-12">
        <ViolinFingerboard
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch ?? null}
          centsDeviation={lastDetectedNote?.cents ?? null}
          centsTolerance={DEFAULT_CENTS_TOLERANCE}
        />
      </Card>
    </>
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
 * Renders the practice interface and manages its complex lifecycle.
 */
export function PracticeMode() {
  const {
    practiceState,
    error,
    loadExercise,
    start,
    stop,
    reset,
    analyser,
    detector,
    consumePipelineEvents,
    liveObservations
  } = usePracticeStore()

  const { status, currentNoteIndex, targetNote, totalNotes, progress } =
    derivePracticeState(practiceState)

  const loadedRef = useRef(false)
  const osmdHook = useOSMDSafe(practiceState?.exercise.musicXML ?? '')

  useEffect(() => {
    if (!loadedRef.current && !practiceState) {
      loadExercise(allExercises[0])
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])

  useEffect(() => {
    syncCursorWithNote(osmdHook, status, currentNoteIndex)
  }, [currentNoteIndex, status, osmdHook])

  // NEW: Audio loop connected to the pipeline
  useEffect(() => {
    // Only execute if in listening mode
    if (status !== 'listening') return
    if (!analyser || !detector) return

    const abortController = new AbortController()

    const runPipeline = async () => {
      try {
        // 1. Create raw pitch stream
        const rawPitchStream = createRawPitchStream(
          analyser,
          detector,
          abortController.signal
        )

        // 2. Create event pipeline
        const eventPipeline = createPracticeEventPipeline(
          rawPitchStream,
          () => practiceState?.exercise.notes[practiceState.currentIndex] ?? null,
          () => practiceState?.currentIndex ?? 0,
          {
            minRms: 0.015,
            minConfidence: 0.85,
            centsTolerance: 20, // Stricter than default 25
            requiredHoldTime: 500,
            exercise: practiceState?.exercise,
            bpm: 60,
            sessionStartTime: Date.now()
          },
          abortController.signal
        )

        // 3. Consume events (updates store automatically)
        await consumePipelineEvents(eventPipeline)

      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('[PracticeMode] Pipeline error:', error)
        }
      }
    }

    runPipeline()

    return () => {
      abortController.abort()
    }
  }, [
    status,
    currentNoteIndex,
    analyser,
    detector,
    consumePipelineEvents,
    practiceState?.exercise, // Added to restart pipeline if exercise changes
  ])

  const history = practiceState?.detectionHistory ?? []
  const lastDetectedNote = history.length > 0 ? history[0] : null
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : null

  const handleRestart = () => practiceState && loadExercise(practiceState.exercise)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {error && <ErrorDisplay error={error.message} onReset={reset} />}
        <div className="grid gap-6 md:grid-cols-2">
          <ExerciseSelector
            value={practiceState?.exercise.id}
            onValueChange={(id) => {
              const exercise = allExercises.find((ex) => ex.id === id)
              if (exercise) loadExercise(exercise)
            }}
            disabled={status !== 'idle'}
          />

          <PracticeControls
            status={status}
            hasExercise={!!practiceState}
            onStart={start}
            onStop={stop}
            onRestart={handleRestart}
            progress={progress}
            currentNoteIndex={currentNoteIndex}
            totalNotes={totalNotes}
          />
        </div>
        <SheetMusicView
          musicXML={practiceState?.exercise.musicXML}
          isReady={osmdHook.isReady}
          error={osmdHook.error}
          containerRef={osmdHook.containerRef}
        />

        <PracticeActiveView
          status={status}
          targetNote={targetNote}
          targetPitchName={targetPitchName}
          lastDetectedNote={lastDetectedNote}
          liveObservations={liveObservations}
        />

        {status === 'completed' && <PracticeCompletion onRestart={handleRestart} />}
      </div>
    </div>
  )
}

function derivePracticeState(practiceState: PracticeState | null) {
  const status = practiceState?.status ?? 'idle'
  const currentNoteIndex = practiceState?.currentIndex ?? 0
  const targetNote = practiceState?.exercise.notes[currentNoteIndex] ?? null
  const totalNotes = practiceState?.exercise.notes.length ?? 0
  const isCompleted = status === 'completed'
  const progress =
    totalNotes > 0 ? ((currentNoteIndex + (isCompleted ? 1 : 0)) / totalNotes) * 100 : 0

  return { status, currentNoteIndex, targetNote, totalNotes, progress }
}

function syncCursorWithNote(
  osmdHook: ReturnType<typeof useOSMDSafe>,
  status: string,
  currentNoteIndex: number,
) {
  if (!osmdHook.isReady) return

  // We only advance the cursor when the status is 'listening'.
  // This avoids double-advancing when transitioning through 'validating' or 'correct'
  // for the same note index.
  if (status === 'listening') {
    if (currentNoteIndex === 0) {
      osmdHook.resetCursor()
    } else {
      osmdHook.advanceCursor()
    }
  }
}
