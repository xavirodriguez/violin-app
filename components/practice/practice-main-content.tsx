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
  return (
    <>
      <PracticeIdleContent {...props} />
      {status === 'idle' && <SelectionPrompt />}
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
      // Fallback: reset to start of exercise if no measure metadata
      setNoteIndex(0)
    }
  }

  const onContinue = () => {
    if (practiceState && status !== 'completed') {
      setNoteIndex(practiceState.currentIndex + 1)
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
