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
import { usePracticeUIEffects } from '@/hooks/use-practice-ui-effects'
import { ExerciseLibrary } from './practice/exercise-library'
import { ErrorDisplay } from './practice/error-display'
import { PracticeControls } from './practice/practice-controls'
import { PracticeActiveView } from './practice/practice-active-view'
import { SheetMusicView } from './practice/sheet-music-view'
import { PracticeSettings } from './practice/practice-settings'
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'

/**
 * Main component for the Interactive Practice Mode.
 *
 * @remarks
 * Coordinates exercise management, audio pipeline, real-time visualization,
 * and user interaction using specialized hooks and sub-components.
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
  usePracticeUIEffects({ status, currentNoteIndex, start, stop, setZenMode, osmdHook })

  useEffect(() => {
    if (!loadedRef.current && !practiceState && allExercises.length > 0) {
      loadExercise(allExercises[0])
      loadedRef.current = true
    }
  }, [loadExercise, practiceState])

  const history = practiceState?.detectionHistory ?? []
  const lastDetectedNote = history.length > 0 ? history[0] : undefined
  const targetPitchName = targetNote ? formatPitchName(targetNote.pitch) : undefined
  const handleRestart = () => practiceState && loadExercise(practiceState.exercise)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {state.status === 'error' && <ErrorDisplay error={state.error.message} onReset={reset} />}
        {state.status === 'initializing' && (
          <Card className="p-12 text-center">Initializing Audio...</Card>
        )}

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
              <PracticeSettings
                autoStartEnabled={autoStartEnabled}
                onAutoStartChange={setAutoStart}
              />
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

        {status === 'idle' && (
          <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
            <div className="bg-primary/10 mb-4 rounded-full p-4">
              <Maximize2 className="text-primary h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Select an exercise to begin</h3>
            <p className="text-muted-foreground max-w-sm">
              Choose from the library below to start your guided practice session with real-time
              feedback.
            </p>
          </Card>
        )}

        <SheetMusicContainer
          status={status}
          sheetMusicView={sheetMusicView}
          setSheetMusicView={setSheetMusicView}
          practiceState={practiceState}
          osmdHook={osmdHook}
          currentNoteIndex={currentNoteIndex}
        />

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
            sessionData={
              sessions[0] && sessions[0].exerciseId === practiceState?.exercise.id
                ? sessions[0]
                : undefined
            }
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

        <KeyboardShortcutsDialog />
      </div>
    </div>
  )
}

/**
 * Derives calculated UI state from the raw practice domain state.
 */
function derivePracticeState(
  practiceState: import('@/lib/practice-core').PracticeState | undefined,
) {
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
 * Component to wrap sheet music and its annotations.
 */
function SheetMusicContainer(params: {
  status: string
  sheetMusicView: 'focused' | 'full'
  setSheetMusicView: (v: 'focused' | 'full') => void
  practiceState: import('@/lib/practice-core').PracticeState | undefined
  osmdHook: ReturnType<typeof useOSMDSafe>
  currentNoteIndex: number
}) {
  const { status, sheetMusicView, setSheetMusicView, practiceState, osmdHook, currentNoteIndex } =
    params
  return (
    <div className="relative">
      {status !== 'idle' && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSheetMusicView(sheetMusicView === 'focused' ? 'full' : 'focused')}
            className="bg-background/80 shadow-sm backdrop-blur-sm"
          >
            {sheetMusicView === 'focused' ? (
              <Maximize2 className="mr-2 h-4 w-4" />
            ) : (
              <Minimize2 className="mr-2 h-4 w-4" />
            )}
            {sheetMusicView === 'focused' ? 'Full View' : 'Focused View'}
          </Button>
        </div>
      )}

      <div
        className={cn(
          'overflow-hidden transition-all duration-500',
          sheetMusicView === 'focused' ? 'max-h-[300px]' : 'max-h-[800px]',
        )}
      >
        <SheetMusicView
          musicXML={practiceState?.exercise.musicXML}
          isReady={osmdHook.isReady}
          error={osmdHook.error || undefined}
          containerRef={osmdHook.containerRef}
        />
        {practiceState && (
          <SheetMusicAnnotations
            annotations={practiceState.exercise.notes.reduce(
              (acc, note, idx) => {
                if (note.annotations) acc[idx] = note.annotations
                return acc
              },
              {} as Record<number, any>,
            )}
            currentNoteIndex={currentNoteIndex}
            osmd={osmdHook.osmd}
            containerRef={osmdHook.containerRef}
          />
        )}
      </div>
    </div>
  )
}
