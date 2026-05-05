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
import { AudioTroubleshooter } from './practice/AudioTroubleshooter'
import { PracticeControls } from './practice/practice-controls'
import { PracticeMainContent } from './practice/practice-main-content'
import { usePracticeLifecycle } from '@/hooks/use-practice-lifecycle'
import { useAudioPlayer } from '@/hooks/use-audio-player'
import { useMetronome } from '@/hooks/use-metronome'
import { NoteAudioService } from '@/lib/note-audio.service'
import { SequencePlayer } from '@/lib/sequence-player'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { useState, useEffect, useMemo } from 'react'
import { Exercise } from '@/lib/domain/exercise'

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
  const lastDrillResult = usePracticeStore((s) => s.lastDrillResult)
  const autoStartEnabled = usePracticeStore((s) => s.autoStartEnabled)
  const isListeningPhase = usePracticeStore((s) => s.isListeningPhase)
  const listenIteration = usePracticeStore((s) => s.listenIteration)
  const countdown = usePracticeStore((s) => s.countdown)

  const [isReferencePlaying, setIsReferencePlaying] = useState(false)
  const [isMetronomeActive, setIsMetronomeActive] = useState(false)
  const bpm = usePracticeStore((s) => s.tempoConfig.bpm)
  const setTempoConfig = usePracticeStore((s) => s.setTempoConfig)

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
  const setLoopRegion = usePracticeStore((s) => s.setLoopRegion)
  const loopRegion = usePracticeStore((s) => s.loopRegion)

  const player = useAudioPlayer()
  const [visualBeat, setVisualBeat] = useState(false)
  const metronome = useMetronome(() => {
    setVisualBeat(true)
    setTimeout(() => setVisualBeat(false), 100)
  })
  const derived = useDerivedPracticeState()

  const sequencePlayer = useMemo(() => new SequencePlayer(player), [player])

  const perfectNoteStreak = practiceState?.perfectNoteStreak ?? 0
  useEffect(() => {
    if (perfectNoteStreak > 0 && perfectNoteStreak % 5 === 0) {
      toast.success('Amazing consistency!', {
        description: `You've played ${perfectNoteStreak} notes with perfect intonation!`,
        icon: '🎻',
      })
    }
  }, [perfectNoteStreak])

  useEffect(() => {
    if (lastDrillResult?.success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c8820a', '#e8a020', '#6a8f62']
      })
    }
  }, [lastDrillResult])

  useEffect(() => {
    if (osmd.isReady) {
      return osmd.onNoteClick(({ noteIndex, event }) => {
        // Shift key to select loop range
        const isShiftPressed = event.shiftKey

        if (isShiftPressed && loopRegion?.isEnabled) {
          const start = Math.min(loopRegion.startNoteIndex, noteIndex)
          const end = Math.max(loopRegion.startNoteIndex, noteIndex)
          setLoopRegion({ ...loopRegion, startNoteIndex: start, endNoteIndex: end })
        } else {
          const clickedNote = practiceState?.exercise.notes[noteIndex]
          if (clickedNote) {
            const freq = NoteAudioService.getFrequencyFromTargetNote(clickedNote)
            player.playNote(freq, 1500)
          }

          // Also set as start of loop if shift not pressed
          setLoopRegion({
            startNoteIndex: noteIndex,
            endNoteIndex: noteIndex,
            isEnabled: true,
            tempoMultiplier: 1.0,
            history: [],
          })
        }
      })
    }
  }, [osmd.isReady, practiceState?.exercise, player, loopRegion, setLoopRegion])

  useEffect(() => {
    if (osmd.isReady && loopRegion?.isEnabled) {
      osmd.highlightRange(loopRegion.startNoteIndex, loopRegion.endNoteIndex)
    }
  }, [osmd.isReady, loopRegion])
  const cents = Math.round(35 - (intonationSkill / 100) * 25)

  const lifecycleParams = {
    dispatch,
    status: derived.status,
    currentNoteIndex: derived.currentNoteIndex,
    onToggleZenMode: () => viewActions.setIsZen((v) => !v),
    scoreView: osmd.scoreView,
  }
  usePracticeLifecycle(lifecycleParams)

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {isListeningPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center text-white">
            <h2 className="mb-4 text-4xl font-bold">Escuchando referencia...</h2>
            <p className="text-2xl">Iteración {listenIteration} / 2</p>
            <div className="mt-8 flex justify-center space-x-2">
              <div className="h-3 w-3 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.3s]"></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.15s]"></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-amber-500"></div>
            </div>
            <button
              onClick={() => usePracticeStore.getState().stop()}
              className="mt-12 rounded-full border border-white/30 bg-white/10 px-6 py-2 transition-colors hover:bg-white/20"
            >
              Cancelar y tocar
            </button>
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="text-center text-white">
            <h2 className="mb-4 text-2xl font-semibold tracking-widest text-amber-400 uppercase">
              Prepárate
            </h2>
            <div className="animate-ping-once text-9xl font-black">{countdown}</div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <PracticeStatusHeader />
        <PracticeControlsRow
          isZen={viewState.isZen}
          onPlayReference={async () => {
            if (isReferencePlaying) {
              sequencePlayer.stop()
              setIsReferencePlaying(false)
            } else if (practiceState) {
              setIsReferencePlaying(true)
              await sequencePlayer.play(
                practiceState.exercise,
                (index) => osmd.scoreView.sync(index),
                { bpm, mode: 'expressive' },
              )
              setIsReferencePlaying(false)
            }
          }}
          isReferencePlaying={isReferencePlaying}
          onToggleMetronome={async () => {
            await metronome.toggle(bpm)
            setIsMetronomeActive(metronome.isActive())
          }}
          isMetronomeActive={isMetronomeActive}
          visualBeat={visualBeat}
          bpm={bpm}
          onBpmChange={(newBpm) => {
            const indicatedBpm = practiceState?.exercise.indicatedBpm ?? 60
            setTempoConfig({ bpm: newBpm, scale: newBpm / indicatedBpm })
            metronome.setBpm(newBpm)
          }}
        />
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
            applyHeatmap: osmd.applyHeatmap,
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
  const start = usePracticeStore((s) => s.start)

  const isError = state.status === 'error'
  const isInitializing = state.status === 'initializing'

  if (isError) {
    const message = state.error?.message ?? 'Unknown error'
    return <AudioTroubleshooter error={message} onRetry={start} />
  }

  if (isInitializing) {
    return <Card className="p-12 text-center">Initializing Audio...</Card>
  }

  return <></>
}

function PracticeControlsRow({
  isZen,
  onPlayReference,
  isReferencePlaying,
  onToggleMetronome,
  isMetronomeActive,
  visualBeat,
  bpm,
  onBpmChange,
}: {
  isZen: boolean
  onPlayReference?: () => void
  isReferencePlaying?: boolean
  onToggleMetronome?: () => void
  isMetronomeActive?: boolean
  visualBeat?: boolean
  bpm: number
  onBpmChange: (bpm: number) => void
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

  const handleRestart = () =>
    practiceState &&
    dispatch({ type: 'LOAD_EXERCISE', payload: { exercise: practiceState.exercise } })

  return (
    <PracticeControls
      status={status}
      hasExercise={!!practiceState}
      onStart={() => dispatch({ type: 'START_SESSION' })}
      onStop={() => dispatch({ type: 'STOP_SESSION' })}
      onRestart={handleRestart}
      onPlayReference={onPlayReference}
      isReferencePlaying={isReferencePlaying}
      onToggleMetronome={onToggleMetronome}
      isMetronomeActive={isMetronomeActive}
      visualBeat={visualBeat}
      bpm={bpm}
      onBpmChange={onBpmChange}
      progress={progress}
      currentNoteIndex={currentNoteIndex}
      totalNotes={totalNotes}
    />
  )
}
