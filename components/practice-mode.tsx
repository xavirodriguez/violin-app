/**
 * PracticeMode
 *
 * The main container component for the interactive practice session.
 */

'use client'

import { usePracticeStore, useDerivedPracticeState } from '@/stores/practice-store'
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
import { useState, useEffect } from 'react'
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

  const initialize = usePracticeStore.getState().initialize
  const dispatch = usePracticeStore.getState().dispatch

  useEffect(() => {
    initialize()
  }, [initialize])

  const { sessions } = useAnalyticsStore()
  const { intonationSkill } = useProgressStore()
  const { state: viewState, actions: viewActions } = usePracticeViewState()

  const xml = practiceState?.exercise.musicXML ?? ''
  const osmd = useOSMDSafe(xml)
  const derived = useDerivedPracticeState()
  const cents = Math.round(35 - (intonationSkill / 100) * 25)

  const lifecycleParams = {
    dispatch,
    derived,
    onToggleZenMode: () => viewActions.setIsZen((v) => !v),
    scoreView: osmd.scoreView,
    autoStartEnabled,
  }
  usePracticeLifecycle(lifecycleParams)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <PracticeStatusHeader />
        <PracticeControlsRow isZen={viewState.isZen} />
        <PracticePreviewModal viewState={viewState} viewActions={viewActions} />
        <PracticeMainContent
          isZenModeEnabled={viewState.isZen}
          autoStartEnabled={autoStartEnabled}
          setPreviewExercise={viewActions.setPreview}
          centsTolerance={cents}
          sheetMusicView={viewState.view}
          setSheetMusicView={viewActions.setView}
          osmd={{
            isReady: osmd.isReady,
            error: osmd.error,
            containerRef: osmd.containerRef,
            scoreView: osmd.scoreView,
          }}
          sessions={sessions}
          onToggleZenMode={() => viewActions.setIsZen((v) => !v)}
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
  isZen,
}: {
  isZen: boolean
}) {
  const state = usePracticeStore((s) => s.state)
  const derived = useDerivedPracticeState()
  const dispatch = usePracticeStore.getState().dispatch
  const practiceState = usePracticeStore((s) => s.practiceState)

  const { status, progress, currentNoteIndex, totalNotes } = derived

  const isIdle = state.status === 'idle'
  const hasExercise = !!state.exercise
  const shouldShow = !isZen && (!isIdle || hasExercise)

  if (!shouldShow) return <></>

  const handleRestart = () => practiceState && dispatch({ type: 'LOAD_EXERCISE', payload: { exercise: practiceState.exercise } })

  return (
    <PracticeControls
      status={status}
      hasExercise={!!practiceState}
      onStart={() => dispatch({ type: 'START_SESSION' })}
      onStop={() => dispatch({ type: 'STOP_SESSION' })}
      onRestart={handleRestart}
      progress={progress}
      currentNoteIndex={currentNoteIndex}
      totalNotes={totalNotes}
    />
  )
}
