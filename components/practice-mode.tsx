/**
 * PracticeMode
 *
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
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'

/** Default tolerance in cents for the tuner and feedback UI. */
const DEFAULT_CENTS_TOLERANCE = 25

/**
 * Header component for the practice mode, displaying the exercise name.
 *
 * @param props - Component props.
 * @internal
 */
function PracticeHeader({ exerciseName }: { exerciseName?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-foreground mb-2 text-3xl font-bold">{exerciseName}</h2>
      <p className="text-muted-foreground">Play each note in tune to advance.</p>
    </div>
  )
}

/**
 * Library component for browsing and selecting exercises.
 *
 * @remarks
 * Includes filtering by difficulty and progress, as well as an AI-driven recommender.
 *
 * @param props - Component props.
 * @internal
 */
function ExerciseLibrary({
  selectedId,
  onSelect,
  disabled,
}: {
  /** ID of the currently selected exercise. */
  selectedId?: string
  /** Callback triggered when an exercise is chosen. */
  onSelect: (exercise: Exercise) => void
  /** Whether interaction is disabled. */
  disabled: boolean
}) {
  const [activeTab, setActiveTab] = useState('all')
  const { progress, sessions } = useAnalyticsStore()
  const recommended = useMemo(() => {
    return getRecommendedExercise(allExercises, progress, sessions[0]?.exerciseId)
  }, [progress, sessions])

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

/**
 * Display for application-level errors during practice.
 *
 * @param props - Component props.
 * @internal
 */
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

/**
 * Control bar for starting, stopping, and monitoring practice progress.
 *
 * @param props - Component props.
 * @internal
 */
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
  /** Current status of the practice state machine. */
  status: string
  /** Whether an exercise is currently loaded in the store. */
  hasExercise: boolean
  /** Callback to start the practice session. */
  onStart: () => void
  /** Callback to stop the practice session. */
  onStop: () => void
  /** Callback to restart the current exercise. */
  onRestart: () => void
  /** Completion progress (0-100). */
  progress: number
  /** Index of the current target note. */
  currentNoteIndex: number
  /** Total number of notes in the exercise. */
  totalNotes: number
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {(status === 'idle' || !status) && (
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

/**
 * View displaying real-time feedback and fingerboard visualization during practice.
 *
 * @param props - Component props.
 * @internal
 */
function PracticeActiveView({
  status,
  targetNote,
  targetPitchName,
  lastDetectedNote,
  liveObservations,
  holdDuration,
  perfectNoteStreak,
  zenMode,
}: {
  /** Machine status. */
  status: string
  /** The note the user should be playing. */
  targetNote: TargetNote | null
  /** Formatted name of the target pitch. */
  targetPitchName: string | null
  /** Latest note detected by the audio pipeline. */
  lastDetectedNote: DetectedNote | null | undefined
  /** Heuristic observations about current performance. */
  liveObservations?: Observation[]
  /** How long the current note has been held in tune. */
  holdDuration?: number
  /** Number of consecutive notes played perfectly. */
  perfectNoteStreak?: number
  /** Whether Zen Mode is active (hides distractions). */
  zenMode: boolean
}) {
  const isActive = status === 'listening' || status === 'validating' || status === 'correct'
  if (!isActive || !targetNote || !targetPitchName) return null

  return (
    <>
      <Card className="p-12">
        <PracticeFeedback
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch ?? null}
          centsOff={lastDetectedNote?.cents ?? null}
          status={status}
          liveObservations={liveObservations}
          holdDuration={holdDuration}
          requiredHoldTime={500}
          perfectNoteStreak={perfectNoteStreak}
        />
      </Card>
      {!zenMode && (
        <Card className="p-12">
          <ViolinFingerboard
            targetNote={targetPitchName}
            detectedPitchName={lastDetectedNote?.pitch ?? null}
            centsDeviation={lastDetectedNote?.cents ?? null}
            centsTolerance={DEFAULT_CENTS_TOLERANCE}
          />
        </Card>
      )}
    </>
  )
}

/**
 * Display for musical notation using OpenSheetMusicDisplay.
 *
 * @param props - Component props.
 * @internal
 */
function SheetMusicView({
  musicXML,
  isReady,
  error,
  containerRef,
}: {
  /** MusicXML string to render. */
  musicXML?: string
  /** Whether OSMD has finished rendering. */
  isReady: boolean
  /** Rendering error, if any. */
  error: string | null
  /** Reference to the container element for OSMD. */
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
 * Main component for the Interactive Practice Mode.
 *
 * @remarks
 * This component is the primary entry point for the practice experience. It coordinates:
 * 1. **Exercise Management**: Loading, previewing, and selecting exercises from the library.
 * 2. **Audio Pipeline**: Orchestrates the `createPracticeEventPipeline` which connects
 *    raw audio frames to musical domain events (intonation, rhythm).
 * 3. **Real-time Visualization**: Synchronizes progress with `SheetMusic` (via OSMD)
 *    and provides high-fidelity feedback through the `ViolinFingerboard` and `PracticeFeedback`.
 * 4. **User Interaction**: Manages keyboard shortcuts and UI layout toggles like Zen Mode.
 *
 * **Lifecycle & Cleanup**:
 * The component uses multiple `useEffect` hooks to manage:
 * - **Shortcuts**: Global key listeners for hands-free control.
 * - **Pipeline**: Automatic cleanup of the `AbortController` when the session stops
 *   or the component unmounts, preventing memory leaks and orphaned audio processing.
 * - **OSMD Sync**: Precise cursor placement and note highlighting during active play.
 *
 * @example
 * ```tsx
 * <PracticeMode />
 * ```
 *
 * @public
 */
export function PracticeMode() {
  const {
    state,
    practiceState,
    audioLoop,
    detector,
    error,
    loadExercise,
    setAutoStart,
    start,
    stop,
    reset,
    consumePipelineEvents,
    liveObservations,
  } = usePracticeStore()

  const { sessions } = useAnalyticsStore()

  const { status, currentNoteIndex, targetNote, totalNotes, progress } =
    derivePracticeState(practiceState)

  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const [sheetMusicView, setSheetMusicView] = useState<'focused' | 'full'>('focused')
  const [zenMode, setZenMode] = useState(false)
  const [autoStartEnabled, setAutoStartEnabled] = useState(false)

  const loadedRef = useRef(false)
  const osmdHook = useOSMDSafe(practiceState?.exercise.musicXML ?? '')

  /**
   * Effect to load the default exercise upon initial mount if none is selected.
   */
  useEffect(() => {
    if (!loadedRef.current && !practiceState && allExercises.length > 0) {
      loadExercise(allExercises[0])
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])

  /**
   * Effect to sync the OSMD cursor and highlighting whenever the current note changes.
   */
  useEffect(() => {
    syncCursorWithNote(osmdHook, status, currentNoteIndex)
  }, [currentNoteIndex, status, osmdHook])

  /**
   * High-frequency audio pipeline effect.
   *
   * @remarks
   * This effect initializes the `createPracticeEventPipeline` when the user enters
   * the 'listening' status. It connects raw audio data to the store via `consumePipelineEvents`.
   * It handles clean-up via an `AbortController` to prevent memory leaks and race conditions.
   */
  useEffect(() => {
    if (practiceState?.status !== 'listening') return
    if (!audioLoop || !detector) return

    let isActive = true
    const abortController = new AbortController()

    const runPipeline = async () => {
      try {
        // 1. Create raw pitch stream from audio adapters
        const rawPitchStream = createRawPitchStream(
          audioLoop,
          detector,
          abortController.signal
        )

        // 2. Create the domain-aware event pipeline
        const eventPipeline = createPracticeEventPipeline(
          rawPitchStream,
          {
            targetNote: practiceState?.exercise.notes[practiceState.currentIndex] ?? null,
            currentIndex: practiceState?.currentIndex ?? 0,
            sessionStartTime: Date.now(),
          },
          {
            minRms: 0.015,
            minConfidence: 0.85,
            centsTolerance: 20,
            requiredHoldTime: 500,
            exercise: practiceState?.exercise,
            bpm: 60,
          },
          abortController.signal
        )

        // 3. Consumir eventos (actualiza el store automáticamente)
        await consumePipelineEvents(eventPipeline)

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('[PracticeMode] Pipeline error:', error)
      }
    }

    runPipeline()

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [
    practiceState?.status,
    practiceState?.currentIndex,
    audioLoop,
    detector,
    consumePipelineEvents,
    practiceState?.exercise
  ])

  /**
   * Keyboard shortcuts effect.
   *
   * @remarks
   * - Space: Toggle start/stop.
   * - Z: Toggle Zen Mode.
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z') {
        setZenMode(v => !v)
        return
      }

      if (status === 'idle') return

      switch (e.key.toLowerCase()) {
        case ' ': // Spacebar
          e.preventDefault()
          status === 'listening' ? stop() : start()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [status, start, stop])

  const history = practiceState?.detectionHistory ?? []
  const lastDetectedNote = history.length > 0 ? history[0] : null
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : null

  const handleRestart = () => practiceState && loadExercise(practiceState.exercise)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {state.status === 'error' && <ErrorDisplay error={state.error.message} onReset={reset} />}
        {state.status === 'initializing' && <Card className="p-12 text-center">Initializing Audio...</Card>}

        {!zenMode && (state.status !== 'idle' || state.exercise) && (
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
        )}

        {state.status === 'idle' && (
          <div className="space-y-6">
            {!zenMode && (
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
            )}
            <ExerciseLibrary
              selectedId={practiceState?.exercise.id}
              onSelect={(exercise) => setPreviewExercise(exercise)}
              disabled={false}
            />
          </div>
        )}

        <ExercisePreviewModal
          exercise={previewExercise}
          isOpen={!!previewExercise}
          onOpenChange={(open) => !open && setPreviewExercise(null)}
          onStart={() => {
            if (previewExercise) {
              loadExercise(previewExercise)
              setPreviewExercise(null)
              start()
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
                annotations={practiceState.exercise.notes.reduce((acc, note, idx) => {
                  if (note.annotations) acc[idx] = note.annotations
                  return acc
                }, {} as Record<number, any>)}
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
          liveObservations={liveObservations}
          holdDuration={practiceState?.holdDuration}
          perfectNoteStreak={practiceState?.perfectNoteStreak}
          zenMode={zenMode}
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
            onRepeatNote={() => {}}
            onRepeatMeasure={() => {}}
            onContinue={() => {}}
            onTogglePause={() => (status === 'listening' ? stop() : start())}
            onToggleZen={() => setZenMode((v) => !v)}
            isZen={zenMode}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Derives calculated UI state from the raw practice domain state.
 *
 * @param practiceState - The current domain-level practice state.
 * @returns Derived properties (status, progress, totalNotes) for UI consumption.
 * @internal
 */
function derivePracticeState(practiceState: import('@/lib/practice-core').PracticeState | undefined) {
  const status = practiceState?.status ?? 'idle'
  const currentNoteIndex = practiceState?.currentIndex ?? 0
  const targetNote = practiceState?.exercise.notes[currentNoteIndex] ?? undefined
  const totalNotes = practiceState?.exercise.notes.length ?? 0
  const isCompleted = status === 'completed'
  const progress =
    totalNotes > 0 ? ((currentNoteIndex + (isCompleted ? 1 : 0)) / totalNotes) * 100 : 0

  return { status, currentNoteIndex, targetNote, totalNotes, progress }
}

/**
 * Synchronizes the sheet music cursor and highlighting with the current practice note.
 *
 * @remarks
 * Uses the OSMD instance to advance the cursor and apply visual highlighting.
 * Also performs smooth auto-scrolling to keep the current note centered in view.
 *
 * @param osmdHook - The OSMD hook state.
 * @param status - Current practice status.
 * @param currentNoteIndex - Index of the note to highlight.
 * @internal
 */
function syncCursorWithNote(
  osmdHook: ReturnType<typeof useOSMDSafe>,
  status: string,
  currentNoteIndex: number,
) {
  if (!osmdHook.isReady) return

  if (status === 'listening' || status === 'validating' || status === 'correct') {
    if (currentNoteIndex === 0) {
      osmdHook.resetCursor()
    } else {
      osmdHook.advanceCursor()
    }

    // Smooth auto-scroll to keep the cursor centered
    const cursorElement = osmdHook.containerRef.current?.querySelector('.osmd-cursor')
    if (cursorElement) {
      cursorElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }

    // Apply highlighting to the current note
    osmdHook.highlightCurrentNote(currentNoteIndex)
  }
}
