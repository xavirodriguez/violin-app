/**
 * PracticeMode
 *
 * The main container component for the interactive practice session.
 */

'use client'

import { usePracticeStore } from '@/stores/practice-store'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { Card } from '@/components/ui/card'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { ExercisePreviewModal } from '@/components/exercise-preview-modal'
import { useProgressStore } from '@/stores/progress.store'
import { ErrorDisplay } from './practice/error-display'
import { PracticeControls } from './practice/practice-controls'
import { PracticeMainContent } from './practice/practice-main-content'
import { usePracticeLifecycle } from '@/hooks/use-practice-lifecycle'
import { derivePracticeState, DerivedPracticeState } from '@/lib/practice/practice-utils'
import { useState } from 'react'
import { Exercise } from '@/lib/exercises/types'

/**
 * Custom hook to manage the local UI state for the practice view.
 */
export function usePracticeViewState() {
  const [preview, setPreview] = useState<Exercise | undefined>(undefined)
  const [view, setView] = useState<'focused' | 'full'>('focused')
  const [isZen, setIsZen] = useState(false)

  const state = { preview, view, isZen }
  const actions = { setPreview, setView, setIsZen }

  return { state, actions }
}

export function PracticeMode() {
  const practiceState = usePracticeStore((s) => s.practiceState)
  const autoStartEnabled = usePracticeStore((s) => s.autoStartEnabled)
  const state = usePracticeStore((s) => s.state)
  const liveObservations = usePracticeStore((s) => s.liveObservations)

  const loadExercise = usePracticeStore.getState().loadExercise
  const start = usePracticeStore.getState().start
  const stop = usePracticeStore.getState().stop
  const setAutoStart = usePracticeStore.getState().setAutoStart
  const setNoteIndex = usePracticeStore.getState().setNoteIndex

  const { sessions } = useAnalyticsStore()
  const { intonationSkill } = useProgressStore()
  const { state: viewState, actions: viewActions } = usePracticeViewState()

  const xml = practiceState?.exercise.musicXML ?? ''
  const osmd = useOSMDSafe(xml)
  const derived = derivePracticeState(practiceState)
  const cents = Math.round(35 - (intonationSkill / 100) * 25)

  const lifecycleParams = {
    practiceState,
    loadExercise,
    start,
    stop,
    derived,
    setIsZen: viewActions.setIsZen,
    osmdHook: osmd,
    autoStartEnabled,
  }
  usePracticeLifecycle(lifecycleParams)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <PracticeStatusHeader />
        <PracticeControlsRow derived={derived} isZen={viewState.isZen} />
        <PracticePreviewModal viewState={viewState} viewActions={viewActions} />
        <PracticeMainContent
          state={state}
          practiceState={practiceState}
          status={derived.status}
          isZenModeEnabled={viewState.isZen}
          autoStartEnabled={autoStartEnabled}
          toggleAutoStart={setAutoStart}
          setPreviewExercise={viewActions.setPreview}
          currentNoteIndex={derived.currentNoteIndex}
          targetNote={derived.targetNote}
          targetPitchName={derived.targetPitchName}
          lastDetectedNote={derived.lastDetectedNote ?? undefined}
          liveObservations={liveObservations}
          centsTolerance={cents}
          sheetMusicView={viewState.view}
          setSheetMusicView={viewActions.setView}
          osmd={osmd}
          scoreView={osmd.scoreView}
          handleRestart={() => practiceState && loadExercise(practiceState.exercise)}
          sessions={sessions}
          start={start}
          stop={stop}
          onToggleZenMode={() => viewActions.setIsZen((prev) => !prev)}
          jumpToNote={setNoteIndex}
        />
        <KeyboardShortcutsDialog />
      </div>
    </div>
  )
}

function PracticePreviewModal(params: {
  viewState: { preview: Exercise | undefined }
  viewActions: { setPreview: (ex: Exercise | undefined) => void }
}) {
  const { viewState, viewActions } = params
  const loadExercise = usePracticeStore((s) => s.loadExercise)
  const isOpen = !!viewState.preview

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      viewActions.setPreview(undefined)
    }
  }

  const handleStart = async () => {
    if (viewState.preview) {
      await loadExercise(viewState.preview)
      viewActions.setPreview(undefined)
    }
  }

  return (
    <ExercisePreviewModal
      exercise={viewState.preview}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      onStart={handleStart}
    />
  )
}

function PracticeStatusHeader() {
  const state = usePracticeStore((s) => s.state)
  const reset = usePracticeStore((s) => s.reset)

  const isError = state.status === 'error'
  const isInitializing = state.status === 'initializing'

  if (isError) {
    const message = state.error?.message ?? 'Unknown error'
    return <ErrorDisplay error={message} onReset={reset} />
  }

  if (isInitializing) {
    return <Card className="p-12 text-center">Initializing Audio...</Card>
  }

  return <></>
}

function PracticeControlsRow({
  derived,
  isZen,
}: {
  derived: DerivedPracticeState
  isZen: boolean
}) {
  const state = usePracticeStore((s) => s.state)
  const start = usePracticeStore((s) => s.start)
  const stop = usePracticeStore((s) => s.stop)
  const loadExercise = usePracticeStore((s) => s.loadExercise)
  const practiceState = usePracticeStore((s) => s.practiceState)

  const { status, progress, currentNoteIndex, totalNotes } = derived

  const isIdle = state.status === 'idle'
  const hasExercise = !!state.exercise
  const shouldShow = !isZen && (!isIdle || hasExercise)

  if (!shouldShow) return <></>

  const handleRestart = () => practiceState && loadExercise(practiceState.exercise)

  return (
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
}
