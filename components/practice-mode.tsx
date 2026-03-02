/**
 * PracticeMode
 *
 * The main container component for the interactive practice session.
 * It orchestrates exercise selection, audio processing, sheet music rendering,
 * and real-time feedback.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePracticeStore } from '@/stores/practice-store'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PracticeQuickActions } from '@/components/practice-quick-actions'
import { allExercises } from '@/lib/exercises'
import { formatPitchName } from '@/lib/practice-core'
import type { Exercise } from '@/lib/domain/musical-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Maximize2, Minimize2 } from 'lucide-react'
import { SheetMusicAnnotations } from '@/components/sheet-music-annotations'
import { PracticeCompletion } from '@/components/practice-completion'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { ExercisePreviewModal } from '@/components/exercise-preview-modal'
import { usePracticePipeline } from '@/hooks/use-practice-pipeline'
import { PracticeHeader } from './practice/practice-header'
import { ExerciseLibrary } from './practice/exercise-library'
import { ErrorDisplay } from './practice/error-display'
import { PracticeControls } from './practice/practice-controls'
import { PracticeActiveView } from './practice/practice-active-view'
import { SheetMusicView } from './practice/sheet-music-view'

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

  const [previewExercise, setPreviewExercise] = useState<Exercise | undefined>(undefined)
  const [sheetMusicView, setSheetMusicView] = useState<'focused' | 'full'>('focused')
  const [zenMode, setZenMode] = useState(false)
  const [autoStartEnabled] = useState(false)

  const loadedRef = useRef(false)
  const osmdHook = useOSMDSafe(practiceState?.exercise.musicXML ?? '')

  usePracticePipeline({ practiceState, audioLoop, detector, consumePipelineEvents })

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
  const lastDetectedNote = history.length > 0 ? history[0] : undefined
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : undefined

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
          onOpenChange={(open) => !open && setPreviewExercise(undefined)}
          onStart={() => {
            if (previewExercise) {
              loadExercise(previewExercise)
              setPreviewExercise(undefined)
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
              error={osmdHook.error || undefined}
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
            sessionData={sessions[0] && sessions[0].exerciseId === practiceState?.exercise.id ? sessions[0] : undefined}
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
