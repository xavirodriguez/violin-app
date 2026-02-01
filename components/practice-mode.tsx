/**
 * PracticeMode
 * The main container component for the interactive practice session.
 * It orchestrates exercise selection, audio processing, sheet music rendering,
 * and real-time feedback.
 */

'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { usePracticeStore } from '@/stores/practice-store'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PracticeQuickActions } from '@/components/practice-quick-actions'
import { allExercises } from '@/lib/exercises'
import {
  type TargetNote,
  type DetectedNote,
  formatPitchName,
} from '@/lib/practice-core'
import type { Exercise } from '@/lib/domain/musical-types'
import { type Observation } from '@/lib/technique-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play,
  Square,
  RotateCcw,
  AlertCircle,
  List,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { SheetMusic } from '@/components/sheet-music'
import { SheetMusicAnnotations } from '@/components/sheet-music-annotations'
import { ErrorBoundary } from '@/components/error-boundary'
import { PracticeFeedback } from '@/components/practice-feedback'
import { PracticeCompletion } from '@/components/practice-completion'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { ExerciseCard } from '@/components/exercise-card'
import { ExercisePreviewModal } from '@/components/exercise-preview-modal'
import { getRecommendedExercise } from '@/lib/exercise-recommender'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PracticeHeader({ exerciseName }: { exerciseName?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-foreground mb-2 text-3xl font-bold">{exerciseName}</h2>
      <p className="text-muted-foreground">Play each note in tune to advance.</p>
    </div>
  )
}

function ExerciseLibrary({
  selectedId,
  onSelect,
  disabled,
}: {
  selectedId?: string
  onSelect: (exercise: Exercise) => void
  disabled: boolean
}) {
  const [activeTab, setActiveTab] = useState('all')
  const { progress, sessions } = useAnalyticsStore()

  const recommended = useMemo(() =>
    getRecommendedExercise(allExercises, progress, sessions[0]?.exerciseId),
    [progress, sessions]
  )

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      if (activeTab === 'all') return true
      if (activeTab === 'beginner') return ex.difficulty === 'Beginner'
      if (activeTab === 'intermediate') return ex.difficulty === 'Intermediate'
      if (activeTab === 'inProgress') {
        const stats = progress.exerciseStats[ex.id]
        return stats && stats.timesCompleted > 0 && stats.bestAccuracy < 100
      }
      return true
    })
  }, [activeTab, progress.exerciseStats])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <List className="h-5 w-5" />
          Exercise Library
        </h3>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Int.</TabsTrigger>
            <TabsTrigger value="inProgress">In Progress</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isRecommended={recommended?.id === exercise.id}
            isSelected={selectedId === exercise.id}
            onClick={() => onSelect(exercise)}
            lastAttempt={progress.exerciseStats[exercise.id] ? {
              accuracy: progress.exerciseStats[exercise.id].bestAccuracy,
              timestamp: progress.exerciseStats[exercise.id].lastPracticedMs
            } : undefined}
          />
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No exercises found for this filter.</p>
        </div>
      )}
    </div>
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


function PracticeActiveView({
  status,
  targetNote,
  targetPitchName,
  lastDetectedNote,
  lastObservations,
  holdDuration,
  perfectNoteStreak,
}: {
  status: string
  targetNote: TargetNote | null
  targetPitchName: string | null
  lastDetectedNote: DetectedNote | null | undefined
  lastObservations?: Observation[]
  holdDuration?: number
  perfectNoteStreak?: number
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
          liveObservations={lastObservations}
          holdDuration={holdDuration}
          requiredHoldTime={500}
          perfectNoteStreak={perfectNoteStreak}
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
    state,
    practiceState,
    error,
    loadExercise,
    start,
    stop,
    reset,
    autoStartEnabled,
    setAutoStart,
    setNoteIndex
  } = usePracticeStore()

  const { sessions } = useAnalyticsStore()

  const { status, currentNoteIndex, targetNote, totalNotes, progress } =
    derivePracticeState(practiceState)

  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const [sheetMusicView, setSheetMusicView] = useState<'focused' | 'full'>('focused')
  const [zenMode, setZenMode] = useState(false)

  const loadedRef = useRef(false)
  const osmdHook = useOSMDSafe(practiceState?.exercise.musicXML ?? '')

  useEffect(() => {
    if (!loadedRef.current && !practiceState) {
      // Don't auto-load first exercise into store, let user select from library
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])

  useEffect(() => {
    syncCursorWithNote(osmdHook, status, currentNoteIndex)
  }, [currentNoteIndex, status, osmdHook])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (status === 'idle') return

      switch (e.key.toLowerCase()) {
        case ' ': // Spacebar
          e.preventDefault()
          status === 'listening' ? stop() : start()
          break
        case 'r':
          setNoteIndex(currentNoteIndex)
          break
        case 'c':
          setNoteIndex(currentNoteIndex + 1)
          break
        case 'z':
          setZenMode(v => !v)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [status, currentNoteIndex, start, stop, setNoteIndex])

  const history = practiceState?.detectionHistory ?? []
  const lastDetectedNote = history.length > 0 ? history[0] : null
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : null

  const handleRestart = () => practiceState && loadExercise(practiceState.exercise)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {state.status === 'error' && <ErrorDisplay error={state.error.message} onReset={reset} />}
        {state.status === 'initializing' && <Card className="p-12 text-center">Initializing Audio...</Card>}

        {state.status === 'idle' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-end gap-4 p-4 bg-muted/20 rounded-xl border">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-start"
                  checked={autoStartEnabled}
                  onCheckedChange={setAutoStart}
                />
                <Label htmlFor="auto-start" className="cursor-pointer">Always Listening (Auto-start)</Label>
              </div>
            </div>
            <ExerciseLibrary
              selectedId={practiceState?.exercise.id}
              onSelect={(exercise) => setPreviewExercise(exercise)}
              disabled={false}
            />
          </div>
        ) : (
          !zenMode && (
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
          )
        )}

        <ExercisePreviewModal
          exercise={previewExercise}
          isOpen={!!previewExercise}
          onOpenChange={(open) => !open && setPreviewExercise(null)}
          onStart={() => {
            if (previewExercise) {
              loadExercise(previewExercise).then(() => {
                setPreviewExercise(null)
                start()
              })
            }
          }}
        />

        <div className="relative">
          {status !== 'idle' && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSheetMusicView((v) => (v === 'focused' ? 'full' : 'focused'))}
                className="bg-background/80 backdrop-blur-sm shadow-sm"
              >
                {sheetMusicView === 'focused' ? (
                  <Maximize2 className="h-4 w-4 mr-2" />
                ) : (
                  <Minimize2 className="h-4 w-4 mr-2" />
                )}
                {sheetMusicView === 'focused' ? 'Full View' : 'Focused View'}
              </Button>
            </div>
          )}

          <div className={cn(
            "transition-all duration-500 overflow-hidden",
            sheetMusicView === 'focused' ? "max-h-[300px]" : "max-h-[800px]"
          )}>
            <SheetMusicView
              musicXML={practiceState?.exercise.musicXML}
              isReady={osmdHook.isReady}
              error={osmdHook.error}
              containerRef={osmdHook.containerRef}
            />
            {practiceState && (
              <SheetMusicAnnotations
                annotations={{
                  // Sample annotation for demo purposes
                  [currentNoteIndex]: { fingerNumber: 1, bowDirection: 'down' }
                }}
                currentNoteIndex={currentNoteIndex}
                osmd={osmdHook.osmd}
                containerRef={osmdHook.containerRef}
              />
            )}
          </div>
        </div>

        <PracticeActiveView
          status={status}
          targetNote={targetNote}
          targetPitchName={targetPitchName}
          lastDetectedNote={lastDetectedNote}
          lastObservations={practiceState?.lastObservations}
          holdDuration={practiceState?.holdDuration}
          perfectNoteStreak={practiceState?.perfectNoteStreak}
        />

        {status === 'completed' && (
          <PracticeCompletion
            onRestart={handleRestart}
            sessionData={sessions[0] && sessions[0].exerciseId === practiceState?.exercise.id ? sessions[0] : null}
          />
        )}

        {status !== 'idle' && (
          <PracticeQuickActions
            status={status}
            onRepeatNote={() => setNoteIndex(currentNoteIndex)}
            onRepeatMeasure={() => setNoteIndex(Math.max(0, currentNoteIndex - 4))}
            onContinue={() => setNoteIndex(currentNoteIndex + 1)}
            onTogglePause={() => (status === 'listening' ? stop() : start())}
            onToggleZen={() => setZenMode((v) => !v)}
            isZen={zenMode}
          />
        )}
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

  if (status === 'listening') {
    if (currentNoteIndex === 0) {
      osmdHook.resetCursor()
    } else {
      // OSMD cursor might need multiple advances if there are rests,
      // but for this simple app, we assume 1 advance = 1 note.
      osmdHook.advanceCursor()
    }

    // Auto-scroll suave para mantener 2-3 compases visibles
    const cursorElement = osmdHook.containerRef.current?.querySelector('.osmd-cursor')
    if (cursorElement) {
      cursorElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }

    // Apply highlight
    osmdHook.highlightCurrentNote(currentNoteIndex)
  }
}
