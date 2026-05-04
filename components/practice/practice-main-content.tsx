/**
 * PracticeMainContent
 *
 * Orchestrates the main views of the practice mode: settings, library, and active session view.
 */

'use client'

import { PracticeSettings } from './practice-settings'
import { ExerciseLibrary } from './exercise-library'
import { SelectionPrompt } from './selection-prompt'
import { SheetMusicContainer } from './sheet-music-container'
import { PracticeActiveView } from './practice-active-view'
import { PracticeCompletion } from '@/components/practice-completion'
import { usePageVisibility } from '@/hooks/use-page-visibility'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PauseCircle, PlayCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PracticeQuickActions } from '@/components/practice-quick-actions'
import { Exercise } from '@/lib/domain/exercise'
import { PracticeState } from '@/lib/domain/practice'
import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { PracticeSession } from '@/lib/domain/practice'
import { usePracticeStore, useDerivedPracticeState } from '@/stores/practice-store'

interface PracticeMainContentProps {
  isZenModeEnabled: boolean
  autoStartEnabled: boolean
  setPreviewExercise: (exercise: Exercise) => void
  centsTolerance: number
  sheetMusicView: 'focused' | 'full'
  setSheetMusicView: (view: 'focused' | 'full') => void
  osmd: {
    isReady: boolean
    error: string | undefined
    containerRef: import('react').RefObject<HTMLDivElement | null>
    scoreView: ScoreViewPort
  }
  sessions: PracticeSession[]
  onToggleZenMode: () => void
}

export function PracticeMainContent(props: PracticeMainContentProps) {
  const state = usePracticeStore((s) => s.state)
  const practiceState = usePracticeStore((s) => s.practiceState)
  const derived = useDerivedPracticeState()
  const { status } = derived
  const isVisible = usePageVisibility()
  const [wasPaused, setWasPaused] = useState(false)

  useEffect(() => {
    if (!isVisible && state.status === 'active') {
      setWasPaused(true)
    }
    if (state.status !== 'active') {
      setWasPaused(false)
    }
  }, [isVisible, state.status])

  const handleResume = () => {
    setWasPaused(false)
  }

  const showPausedBanner = wasPaused && state.status === 'active'

  return (
    <>
      <PracticeIdleContent {...props} />
      {status === 'idle' && <SelectionPrompt />}
      {showPausedBanner && (
        <Card className="mb-6 border-yellow-500 bg-yellow-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PauseCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-700">Session Paused</h3>
                <p className="text-sm text-yellow-600">
                  The session was paused because the tab was in the background.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-500/20"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume View
            </Button>
          </div>
        </Card>
      )}
      <SheetMusicContainer
        {...props}
        practiceState={practiceState}
        status={status}
        currentNoteIndex={derived.currentNoteIndex}
      />
      <PracticeActiveViewContent {...props} />
      <PracticePostSessionContent {...props} />
    </>
  )
}

function PracticeIdleContent(props: PracticeMainContentProps) {
  const state = usePracticeStore((s) => s.state)
  const practiceState = usePracticeStore((s) => s.practiceState)
  const listenImitateActive = usePracticeStore((s) => s.listenImitateActive)
  const setListenImitateActive = usePracticeStore((s) => s.setListenImitateActive)
  const dispatch = usePracticeStore.getState().dispatch
  const {
    isZenModeEnabled,
    autoStartEnabled,
    setPreviewExercise,
  } = props
  if (state.status !== 'idle') return <></>

  return (
    <div className="space-y-6">
      {!isZenModeEnabled && (
        <PracticeSettings
          autoStartEnabled={autoStartEnabled}
          onAutoStartChange={(enabled) => dispatch({ type: 'TOGGLE_AUTO_START', payload: { enabled } })}
          listenImitateEnabled={listenImitateActive}
          onListenImitateChange={setListenImitateActive}
        />
      )}
      <ExerciseLibrary
        selectedId={practiceState?.exercise.id}
        onSelect={setPreviewExercise}
        disabled={false}
      />
    </div>
  )
}

function PracticeActiveViewContent(props: PracticeMainContentProps) {
  const derived = useDerivedPracticeState()
  const practiceState = usePracticeStore((s) => s.practiceState)
  const liveObservations = usePracticeStore((s) => s.liveObservations)
  const {
    isZenModeEnabled,
    centsTolerance,
  } = props
  const hold = practiceState?.holdDuration
  const streak = practiceState?.perfectNoteStreak

  return (
    <PracticeActiveView
      status={derived.status}
      targetNote={derived.targetNote}
      targetPitchName={derived.targetPitchName}
      lastDetectedNote={derived.lastDetectedNote ?? undefined}
      liveObservations={liveObservations}
      holdDuration={hold}
      perfectNoteStreak={streak}
      zenMode={isZenModeEnabled}
      centsTolerance={centsTolerance}
    />
  )
}

function PracticePostSessionContent(props: PracticeMainContentProps) {
  const derived = useDerivedPracticeState()
  const practiceState = usePracticeStore((s) => s.practiceState)
  const dispatch = usePracticeStore.getState().dispatch
  const { status } = derived
  const { sessions, onToggleZenMode, isZenModeEnabled } =
    props
  const isCompleted = status === 'completed'
  const isActive = status !== 'idle'
  const session =
    sessions[0] && sessions[0].exerciseId === practiceState?.exercise.id ? sessions[0] : undefined

  const handleRestartAction = () => practiceState && dispatch({ type: 'LOAD_EXERCISE', payload: { exercise: practiceState.exercise } })

  return (
    <>
      {isCompleted && <PracticeCompletion onRestart={handleRestartAction} sessionData={session} />}
      {isActive && (
        <QuickActionsView
          status={status}
          onToggleZenMode={onToggleZenMode}
          isZen={isZenModeEnabled}
          practiceState={practiceState}
        />
      )}
    </>
  )
}

function QuickActionsView({
  status,
  onToggleZenMode,
  isZen,
  practiceState,
}: {
  status: string
  onToggleZenMode: () => void
  isZen: boolean
  practiceState: PracticeState | undefined
}) {
  const dispatch = usePracticeStore.getState().dispatch
  const onTogglePause = () => (status === 'listening' ? dispatch({ type: 'STOP_SESSION' }) : dispatch({ type: 'START_SESSION' }))
  const onToggleZen = () => onToggleZenMode()

  const onRepeatNote = () => {
    if (practiceState) {
      dispatch({ type: 'JUMP_TO_NOTE', payload: { index: practiceState.currentIndex } })
    }
  }

  const onRepeatMeasure = () => {
    if (practiceState) {
      /**
       * Current implementation resets to the start of the exercise (index 0).
       * In future iterations, this will be updated to identify the start of the
       * current measure using OSMD/domain metadata if available.
       */
      dispatch({ type: 'JUMP_TO_NOTE', payload: { index: 0 } })
    }
  }

  const onContinue = () => {
    if (practiceState && status !== 'completed') {
      /**
       * Skip the current or next note.
       * Always increments the index relative to the current logical position.
       */
      const nextIndex = practiceState.currentIndex + 1
      dispatch({ type: 'JUMP_TO_NOTE', payload: { index: nextIndex } })
    }
  }

  return (
    <PracticeQuickActions
      status={status}
      onRepeatNote={onRepeatNote}
      onRepeatMeasure={onRepeatMeasure}
      onContinue={onContinue}
      onTogglePause={onTogglePause}
      onToggleZen={onToggleZen}
      isZen={isZen}
    />
  )
}
