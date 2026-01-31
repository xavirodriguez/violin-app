/**
 * PracticeMode
 * The main container component for the interactive practice session.
 * It orchestrates exercise selection, audio processing, sheet music rendering,
 * and real-time feedback.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePracticeStore } from '@/stores/practice-store'
import { allExercises, type Exercise } from '@/lib/exercises'
import { formatPitchName, type PracticeState, type DetectedNote } from '@/lib/practice-core'
import { type Observation } from '@/lib/technique-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trophy, AlertCircle, RotateCcw } from 'lucide-react'
import { SheetMusic } from '@/components/sheet-music'
import { ErrorBoundary } from '@/components/error-boundary'
import { PracticeFeedback } from '@/components/practice-feedback'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'
import { PracticeActionBar } from '@/components/practice-action-bar'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'

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

function IdleView({ hasError }: { hasError: boolean }) {
  if (hasError) return null
  return (
    <Card className="p-12 text-center">
      <h3 className="mb-4 text-2xl font-bold">Ready to Practice?</h3>
      <p className="text-muted-foreground mb-6">
        Select an exercise above and click Start to begin your practice session.
      </p>
    </Card>
  )
}

function ListeningView({
  targetPitchName,
  lastDetectedNote,
  status,
  holdDuration,
  observations,
}: {
  targetPitchName: string | null
  lastDetectedNote: DetectedNote | null
  status: string
  holdDuration?: number
  observations?: Observation[]
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-8">
        <PracticeFeedback
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch ?? null}
          centsOff={lastDetectedNote?.cents ?? null}
          status={status}
          holdDuration={holdDuration}
          observations={observations}
        />
      </Card>

      <Card className="p-8">
        <ViolinFingerboard
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch ?? null}
          centsDeviation={lastDetectedNote?.cents ?? null}
        />
      </Card>
    </div>
  )
}

/**
 * Hook to manage session duration and current streak.
 */
function usePracticeSession(status: string, currentNoteIndex: number) {
  const [sessionDuration, setSessionDuration] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const sessionStartRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (status === 'listening') {
      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now()
      }

      timerRef.current = setInterval(() => {
        if (sessionStartRef.current) {
          const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000)
          setSessionDuration(elapsed)
        }
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (status === 'idle' || status === 'completed') {
        sessionStartRef.current = null
        setSessionDuration(0)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [status])

  useEffect(() => {
    if (status === 'listening') {
      setCurrentStreak(currentNoteIndex)
    } else if (status === 'idle' || status === 'completed') {
      setCurrentStreak(0)
    }
  }, [status, currentNoteIndex])

  return { sessionDuration, currentStreak }
}

function useExerciseAutoLoad(
  practiceState: PracticeState | null,
  loadExercise: (ex: Exercise) => void,
) {
  const loadedRef = useRef(false)
  useEffect(() => {
    if (!loadedRef.current && !practiceState) {
      loadExercise(allExercises[0])
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])
}

interface MainContentProps {
  error: { message: string } | null
  reset: () => void
  status: string
  practiceState: PracticeState | null
  osmdHook: {
    isReady: boolean
    error: string | null
    containerRef: React.RefObject<HTMLDivElement | null>
  }
  targetPitchName: string | null
  lastDetectedNote: DetectedNote | null
  handleRestart: () => void
}

function MainContent({
  error,
  reset,
  status,
  practiceState,
  osmdHook,
  targetPitchName,
  lastDetectedNote,
  handleRestart,
}: MainContentProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="space-y-6">
        {error && <ErrorDisplay error={error.message} onReset={reset} />}

        {status === 'idle' && <IdleView hasError={!!error} />}

        {practiceState?.exercise.musicXML && status !== 'completed' && (
          <SheetMusicView
            musicXML={practiceState.exercise.musicXML}
            isReady={osmdHook.isReady}
            error={osmdHook.error}
            containerRef={osmdHook.containerRef}
          />
        )}

        {status === 'listening' && (
          <ListeningView
            targetPitchName={targetPitchName}
            lastDetectedNote={lastDetectedNote}
            status={status}
            holdDuration={practiceState?.holdDuration}
            observations={practiceState?.lastObservations}
          />
        )}

        {status === 'completed' && <PracticeCompletion onRestart={handleRestart} />}
      </div>
    </div>
  )
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
  const { status, currentNoteIndex, targetNote, totalNotes, progress } =
    derivePracticeState(practiceState)

  const { sessionDuration, currentStreak } = usePracticeSession(status, currentNoteIndex)
  useExerciseAutoLoad(practiceState, loadExercise)

  const osmdHook = useOSMDSafe(practiceState?.exercise.musicXML ?? '')
  useEffect(() => {
    syncCursorWithNote(osmdHook, status, currentNoteIndex)
  }, [currentNoteIndex, status, osmdHook])

  const history = practiceState?.detectionHistory ?? []
  const lastDetectedNote = history.length > 0 ? history[history.length - 1] : null
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : null

  const handleRestart = useCallback(
    () => practiceState && loadExercise(practiceState.exercise),
    [practiceState, loadExercise],
  )
  const handleSelectExercise = useCallback(
    (exerciseId: string) => {
      const exercise = allExercises.find((ex) => ex.id === exerciseId)
      if (exercise) loadExercise(exercise)
    },
    [loadExercise],
  )

  return (
    <>
      <PracticeActionBar
        exercises={allExercises}
        selectedExerciseId={practiceState?.exercise.id}
        onSelectExercise={handleSelectExercise}
        status={status as 'idle' | 'listening' | 'validating' | 'completed'}
        currentNoteIndex={currentNoteIndex}
        totalNotes={totalNotes}
        progress={progress}
        onStart={start}
        onStop={stop}
        onRestart={handleRestart}
        sessionDuration={sessionDuration}
        currentStreak={currentStreak}
      />

      <MainContent
        error={error}
        reset={reset}
        status={status}
        practiceState={practiceState}
        osmdHook={osmdHook}
        targetPitchName={targetPitchName}
        lastDetectedNote={lastDetectedNote}
        handleRestart={handleRestart}
      />
    </>
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
  if (status === 'listening' && currentNoteIndex === 0) {
    osmdHook.resetCursor()
  } else if (status === 'listening' && currentNoteIndex > 0) {
    osmdHook.advanceCursor()
  }
}
