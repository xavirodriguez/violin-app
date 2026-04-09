/**
 * PracticeMode
 *
 * The main container component for the interactive practice session.
 */

'use client'

import { usePracticeStore, PracticeStore } from '@/stores/practice-store'
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
  const store = usePracticeStore()
  const { sessions } = useAnalyticsStore()
  const { intonationSkill } = useProgressStore()
  const { state: viewState, actions: viewActions } = usePracticeViewState()

  const osmd = useOSMDSafe(store.practiceState?.exercise.musicXML ?? '')
  const derived = derivePracticeState(store.practiceState)
  const cents = Math.round(35 - (intonationSkill / 100) * 25)

  usePracticeLifecycle({ ...store, derived, setIsZen: viewActions.setIsZen, osmdHook: osmd })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <PracticeStatusHeader store={store} />
        <PracticeControlsRow store={store} derived={derived} isZen={viewState.isZen} />
        <ExercisePreviewModal
          exercise={viewState.preview}
          isOpen={!!viewState.preview}
          onOpenChange={(open) => !open && viewActions.setPreview(undefined)}
          onStart={() => {
            if (viewState.preview) {
              store.loadExercise(viewState.preview)
              viewActions.setPreview(undefined)
              store.start()
            }
          }}
        />
        <PracticeMainContent
          state={store.state}
          practiceState={store.practiceState}
          status={derived.status}
          isZenModeEnabled={viewState.isZen}
          autoStartEnabled={store.autoStartEnabled}
          setAutoStart={store.setAutoStart}
          setPreviewExercise={viewActions.setPreview}
          currentNoteIndex={derived.currentNoteIndex}
          targetNote={derived.targetNote}
          targetPitchName={derived.targetPitchName}
          lastDetectedNote={derived.lastDetectedNote ?? undefined}
          liveObservations={store.liveObservations}
          centsTolerance={cents}
          sheetMusicView={viewState.view}
          setSheetMusicView={viewActions.setView}
          osmdHook={osmd}
          handleRestart={() =>
            store.practiceState && store.loadExercise(store.practiceState.exercise)
          }
          sessions={sessions}
          start={store.start}
          stop={store.stop}
          setIsZenModeEnabled={viewActions.setIsZen}
        />
        <KeyboardShortcutsDialog />
      </div>
    </div>
  )
}

function PracticeStatusHeader({ store }: { store: PracticeStore }) {
  const { state, reset } = store
  const isError = state.status === 'error'
  const isInitializing = state.status === 'initializing'

  if (isError) {
    return <ErrorDisplay error={state.error?.message ?? 'Unknown error'} onReset={reset} />
  }

  if (isInitializing) {
    return <Card className="p-12 text-center">Initializing Audio...</Card>
  }

  return <></>
}

function PracticeControlsRow({
  store,
  derived,
  isZen,
}: {
  store: PracticeStore
  derived: DerivedPracticeState
  isZen: boolean
}) {
  const { state, start, stop, loadExercise } = store
  const { status, progress, currentNoteIndex, totalNotes } = derived

  const isIdle = state.status === 'idle'
  const hasExercise = !!state.exercise
  const shouldShow = !isZen && (!isIdle || hasExercise)

  if (!shouldShow) return <></>

  const handleRestart = () => store.practiceState && loadExercise(store.practiceState.exercise)

  return (
    <PracticeControls
      status={status}
      hasExercise={!!store.practiceState}
      onStart={start}
      onStop={stop}
      onRestart={handleRestart}
      progress={progress}
      currentNoteIndex={currentNoteIndex}
      totalNotes={totalNotes}
    />
  )
}
