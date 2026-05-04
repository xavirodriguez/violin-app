'use client'

import { Play, Square, RotateCcw, Volume2, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PracticeStatus } from '@/lib/domain/practice'
import { MetronomeControl } from '@/components/ui/metronome-control'
import { ReferencePlayer } from '@/components/ui/reference-player'
import { LoopSelector } from '@/components/ui/loop-selector'

interface PracticeControlsProps {
  status: PracticeStatus
  hasExercise: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onPlayReference?: () => void
  isReferencePlaying?: boolean
  onToggleMetronome?: () => void
  isMetronomeActive?: boolean
  visualBeat?: boolean
  bpm: number
  onBpmChange: (bpm: number) => void
  progress: number
  currentNoteIndex: number
  totalNotes: number
}

/**
 * Control bar for starting, stopping, and monitoring practice progress.
 */
export function PracticeControls(props: PracticeControlsProps) {
  const {
    status,
    hasExercise,
    onStart,
    onStop,
    onRestart,
    onPlayReference,
    isReferencePlaying,
    onToggleMetronome,
    isMetronomeActive,
    progress,
    currentNoteIndex,
    totalNotes,
  } = props

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <SessionActions
          status={status}
          disabled={!hasExercise}
          onStart={onStart}
          onStop={onStop}
          onRestart={onRestart}
          onPlayReference={onPlayReference}
          isReferencePlaying={isReferencePlaying}
          onToggleMetronome={onToggleMetronome}
          isMetronomeActive={isMetronomeActive}
        />

        <div className="flex items-center gap-4">
          {hasExercise && (
            <>
              <ReferencePlayer />
              <LoopSelector />
            </>
          )}
          <MetronomeControl />
        </div>

        {hasExercise && (
          <ProgressBar index={currentNoteIndex} total={totalNotes} progress={progress} />
        )}
      </div>
    </Card>
  )
}

interface SessionActionsProps {
  status: PracticeStatus
  disabled: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onPlayReference?: () => void
  isReferencePlaying?: boolean
  onToggleMetronome?: () => void
  isMetronomeActive?: boolean
  visualBeat?: boolean
}

function SessionActions(props: SessionActionsProps) {
  const {
    status,
    disabled,
    onStart,
    onStop,
    onRestart,
    onPlayReference,
    isReferencePlaying,
    onToggleMetronome,
    isMetronomeActive,
    visualBeat,
  } = props

  if (status === 'listening') {
    return (
      <Button onClick={onStop} size="lg" variant="destructive" className="gap-2">
        <Square className="h-4 w-4" /> Stop
      </Button>
    )
  }

  if (status === 'completed') {
    return (
      <Button onClick={onRestart} size="lg" className="gap-2">
        <RotateCcw className="h-4 w-4" /> Practice Again
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button onClick={onStart} size="lg" className="gap-2" disabled={disabled}>
        <Play className="h-4 w-4" /> Start Practice
      </Button>
      <Button
        onClick={onPlayReference}
        size="lg"
        variant="outline"
        className="gap-2"
        disabled={disabled}
      >
        <Volume2 className={isReferencePlaying ? 'animate-pulse text-primary' : 'h-4 w-4'} />
        {isReferencePlaying ? 'Stop Reference' : 'Listen Reference'}
      </Button>
      <Button
        onClick={onToggleMetronome}
        size="lg"
        variant="outline"
        className={`gap-2 transition-colors duration-100 ${visualBeat ? 'bg-primary/20 border-primary' : ''}`}
        disabled={disabled}
      >
        <Timer className={isMetronomeActive ? 'animate-spin text-primary' : 'h-4 w-4'} />
        {isMetronomeActive ? 'Stop Metronome' : 'Metronome'}
      </Button>
    </div>
  )
}

interface ProgressBarProps {
  index: number
  total: number
  progress: number
}

function ProgressBar(props: ProgressBarProps) {
  const { index, total, progress } = props
  const noteDisplay = Math.min(index + 1, total)

  return (
    <div className="flex items-center gap-4">
      <div className="text-muted-foreground text-sm">
        Note {noteDisplay} of {total}
      </div>
      <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
