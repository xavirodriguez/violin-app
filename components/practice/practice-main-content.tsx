/**
 * PracticeMainContent
 *
 * Orchestrates the main views of the practice mode: settings, library, and active session view.
 * Simplified for MVP.
 */

'use client'

import { ExerciseLibrary } from './exercise-library'
import { SelectionPrompt } from './selection-prompt'
import { SheetMusicContainer } from './sheet-music-container'
import { PracticeActiveView } from './practice-active-view'
import { PracticeCompletion } from '@/components/practice-completion'
import { usePageVisibility } from '@/hooks/use-page-visibility'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PauseCircle, PlayCircle, Trophy, Map } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PracticeQuickActions } from '@/components/practice-quick-actions'
import { Exercise } from '@/lib/domain/exercise'
import { PracticeState, PracticeStatus } from '@/lib/domain/practice'
import { Observation } from '@/lib/technique-types'
import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { PracticeSession } from '@/lib/domain/practice'
import { usePracticeStore, useDerivedPracticeState } from '@/stores/practice-store'
import { useCurriculumStore } from '@/stores/curriculum-store'
import { LessonContent } from '@/lib/domain/curriculum'
import { WhyThisMattersModal } from '../curriculum/why-this-matters-modal'
import { CurriculumMap } from '../curriculum/CurriculumMap'
import { PracticeSettings } from './practice-settings'

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
    applyHeatmap: (precisionMap: Record<number, number>) => void
  }
  sessions: PracticeSession[]
  onToggleZenMode: () => void
}

export function PracticeMainContent(props: PracticeMainContentProps) {
  const storeStatus = usePracticeStore((s) => s.status)
  const practiceState = usePracticeStore((s) => s.practiceState)
  const derived = useDerivedPracticeState()
  const { status } = derived
  const isVisible = usePageVisibility()
  const [wasPaused, setWasPaused] = useState(false)

  const { units } = useCurriculumStore()
  const [showPedagogy, setShowPedagogy] = useState(false)
  const [activePedagogy, setActivePedagogy] = useState<LessonContent | null>(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const win = window as unknown as { VM_SHOW_MAP?: (val: boolean) => void }
    win.VM_SHOW_MAP = setShowMap
    return () => {
      delete win.VM_SHOW_MAP
    }
  }, [])

  useEffect(() => {
    if (!isVisible && storeStatus === 'active') {
      setWasPaused(true)
    }
    if (storeStatus !== 'active') {
      setWasPaused(false)
    }
  }, [isVisible, storeStatus])

  useEffect(() => {
    if (practiceState && storeStatus === 'ready') {
      const unit = units.find(u => u.lessons.some(l => l.exerciseId === practiceState.exercise.id))
      if (unit && !unit.isCompleted) {
        setActivePedagogy(unit.whyThisMatters)
        setShowPedagogy(true)
      }
    }
  }, [practiceState?.exercise.id, storeStatus, units])

  const handleResume = () => {
    setWasPaused(false)
  }

  const showPausedBanner = wasPaused && storeStatus === 'active'

  return (
    <>
      {showMap && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 pb-20">
             <div className="sticky top-0 z-10 py-6 flex justify-between items-center bg-transparent">
                <Button variant="ghost" onClick={() => setShowMap(false)}>
                  ← Volver a Práctica
                </Button>
             </div>
             <CurriculumMap />
          </div>
        </div>
      )}
      {activePedagogy && (
        <WhyThisMattersModal
          content={activePedagogy}
          isOpen={showPedagogy}
          onClose={() => setShowPedagogy(false)}
        />
      )}
      <PracticeIdleContent {...props} />
      {status === 'idle' && !practiceState && <SelectionPrompt />}
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
        status={status as PracticeStatus}
        currentNoteIndex={derived.currentNoteIndex}
      />
      <PracticeActiveViewContent {...props} />
      <PracticePostSessionContent {...props} />
    </>
  )
}

function PracticeIdleContent(props: PracticeMainContentProps) {
  const storeStatus = usePracticeStore((s) => s.status)
  const practiceState = usePracticeStore((s) => s.practiceState)
  const autoStartEnabled = usePracticeStore((s) => s.autoStartEnabled)
  const listenImitateActive = usePracticeStore((s) => s.listenImitateActive)
  const setListenImitateActive = usePracticeStore((s) => s.setListenImitateActive)
  const bpm = usePracticeStore((s) => s.tempoConfig.bpm)
  const setTempoConfig = usePracticeStore((s) => s.setTempoConfig)
  const { isZenModeEnabled, setPreviewExercise } = props

  if (storeStatus !== 'ready' && storeStatus !== 'idle') return <></>

  const setShowMap = (val: boolean) =>
    (window as unknown as { VM_SHOW_MAP?: (val: boolean) => void }).VM_SHOW_MAP?.(val)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-muted/10 p-3 rounded-lg border border-dashed">
         <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-tight">Tu Progreso</span>
         </div>
         <Button variant="outline" size="sm" className="h-8 text-xs gap-2" onClick={() => setShowMap(true)}>
            <Map className="h-3.5 w-3.5" />
            Ver Mapa de Aprendizaje
         </Button>
      </div>
      {!isZenModeEnabled && (
        <PracticeSettings
          autoStartEnabled={autoStartEnabled}
          onAutoStartChange={() => {}} // No-op for MVP simplification
          listenImitateEnabled={listenImitateActive}
          onListenImitateChange={setListenImitateActive}
          bpm={bpm}
          onBpmChange={(val) => {
            const indicated = practiceState?.exercise.indicatedBpm || 60
            setTempoConfig({ bpm: val, scale: val / indicated })
          }}
          indicatedBpm={practiceState?.exercise.indicatedBpm}
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
  const liveObservations = usePracticeStore((s) => s.liveObservations) as Observation[]
  const { isZenModeEnabled, centsTolerance } = props
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
  const { sessions, onToggleZenMode, isZenModeEnabled } = props
  const isCompleted = status === 'completed'
  const isActive = status !== 'idle'
  const session =
    sessions[0] && sessions[0].exerciseId === practiceState?.exercise.id ? sessions[0] : undefined

  const handleRestartAction = () =>
    practiceState &&
    dispatch({ type: 'LOAD_EXERCISE', payload: { exercise: practiceState.exercise } })

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
  const onTogglePause = () =>
    status === 'listening' || status === 'validating' || status === 'correct'
      ? dispatch({ type: 'STOP_SESSION' })
      : dispatch({ type: 'START_SESSION' })
  const onToggleZen = () => onToggleZenMode()

  const onRepeatNote = () => {
    if (practiceState) {
      dispatch({ type: 'JUMP_TO_NOTE', payload: { index: practiceState.currentIndex } })
    }
  }

  const onRepeatMeasure = () => {
    if (practiceState) {
      dispatch({ type: 'JUMP_TO_NOTE', payload: { index: 0 } })
    }
  }

  const onContinue = () => {
    if (practiceState && status !== 'completed') {
      const nextIndex = practiceState.currentIndex + 1
      dispatch({ type: 'JUMP_TO_NOTE', payload: { index: nextIndex } })
    }
  }

  return (
    <PracticeQuickActions
      status={status as PracticeStatus}
      onRepeatNote={onRepeatNote}
      onRepeatMeasure={onRepeatMeasure}
      onContinue={onContinue}
      onTogglePause={onTogglePause}
      onToggleZen={onToggleZen}
      isZen={isZen}
    />
  )
}
