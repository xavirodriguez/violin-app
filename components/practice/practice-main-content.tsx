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
import { Exercise, Note } from '@/lib/exercises/types'
import { PracticeState, DetectedNote } from '@/lib/practice-core'
import { Observation } from '@/lib/technique-types'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { PracticeStoreState } from '@/lib/practice/practice-states'
import { PracticeSession } from '@/stores/analytics-store'

interface PracticeMainContentProps {
  state: PracticeStoreState
  practiceState: PracticeState | undefined
  status: string
  isZenModeEnabled: boolean
  autoStartEnabled: boolean
  setAutoStart: (enabled: boolean) => void
  setPreviewExercise: (exercise: Exercise) => void
  currentNoteIndex: number
  targetNote: Note | undefined
  targetPitchName: string | undefined
  lastDetectedNote: DetectedNote | undefined
  liveObservations: Observation[]
  centsTolerance: number
  sheetMusicView: 'focused' | 'full'
  setSheetMusicView: (view: 'focused' | 'full') => void
  osmdHook: ReturnType<typeof useOSMDSafe>
  handleRestart: () => void
  sessions: PracticeSession[]
  start: () => void
  stop: () => void
  setIsZenModeEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void
  setNoteIndex: (index: number) => void
}

export function PracticeMainContent(props: PracticeMainContentProps) {
  const { status } = props
  const isVisible = usePageVisibility()
  const [wasPaused, setWasPaused] = useState(false)

  useEffect(() => {
    if (!isVisible && props.state.status === 'active') {
      setWasPaused(true)
    }
  }, [isVisible, props.state.status])

  const handleResume = () => {
    setWasPaused(false)
  }

  const showPausedBanner = wasPaused && props.state.status === 'active'

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
      <SheetMusicContainer {...props} />
      <PracticeActiveViewContent {...props} />
      <PracticePostSessionContent {...props} />
    </>
  )
}

function PracticeIdleContent(props: PracticeMainContentProps) {
  const {
    state,
    isZenModeEnabled,
    autoStartEnabled,
    setAutoStart,
    practiceState,
    setPreviewExercise,
  } = props
  if (state.status !== 'idle') return <></>

  return (
    <div className="space-y-6">
      {!isZenModeEnabled && (
        <PracticeSettings autoStartEnabled={autoStartEnabled} onAutoStartChange={setAutoStart} />
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
  const {
    status,
    targetNote,
    targetPitchName,
    lastDetectedNote,
    liveObservations,
    practiceState,
    isZenModeEnabled,
    centsTolerance,
  } = props
  const hold = practiceState?.holdDuration
  const streak = practiceState?.perfectNoteStreak

  return (
    <PracticeActiveView
      status={status}
      targetNote={targetNote}
      targetPitchName={targetPitchName}
      lastDetectedNote={lastDetectedNote}
      liveObservations={liveObservations}
      holdDuration={hold}
      perfectNoteStreak={streak}
      zenMode={isZenModeEnabled}
      centsTolerance={centsTolerance}
    />
  )
}

function PracticePostSessionContent(props: PracticeMainContentProps) {
  const {
    status,
    handleRestart,
    sessions,
    practiceState,
    start,
    stop,
    setIsZenModeEnabled,
    isZenModeEnabled,
  } = props
  const isCompleted = status === 'completed'
  const isActive = status !== 'idle'
  const session =
    sessions[0] && sessions[0].exerciseId === practiceState?.exercise.id ? sessions[0] : undefined

  return (
    <>
      {isCompleted && <PracticeCompletion onRestart={handleRestart} sessionData={session} />}
      {isActive && (
        <QuickActionsView
          status={status}
          start={start}
          stop={stop}
          setZen={setIsZenModeEnabled}
          isZen={isZenModeEnabled}
          practiceState={practiceState}
          setNoteIndex={props.setNoteIndex}
        />
      )}
    </>
  )
}

function QuickActionsView({
  status,
  start,
  stop,
  setZen,
  isZen,
  practiceState,
  setNoteIndex,
}: {
  status: string
  start: () => void
  stop: () => void
  setZen: (enabled: boolean | ((prev: boolean) => boolean)) => void
  isZen: boolean
  practiceState: PracticeState | undefined
  setNoteIndex: (index: number) => void
}) {
  const onTogglePause = () => (status === 'listening' ? stop() : start())
  const onToggleZen = () => setZen((prev: boolean) => !prev)

  const onRepeatNote = () => {
    if (practiceState) {
      setNoteIndex(practiceState.currentIndex)
    }
  }

  const onRepeatMeasure = () => {
    if (practiceState) {
      /**
       * Current implementation resets to the start of the exercise (index 0).
       * In future iterations, this will be updated to identify the start of the
       * current measure using OSMD/domain metadata if available.
       */
      setNoteIndex(0)
    }
  }

  const onContinue = () => {
    if (practiceState && status !== 'completed') {
      /**
       * Skip the current or next note.
       * Always increments the index relative to the current logical position.
       */
      const nextIndex = practiceState.currentIndex + 1
      setNoteIndex(nextIndex)
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
