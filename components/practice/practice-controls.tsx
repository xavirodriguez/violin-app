'use client'

import { Play, Square, RotateCcw, Volume2, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PracticeStatus } from '@/lib/domain/practice'

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
    bpm,
    onBpmChange,
    progress,
    currentNoteIndex,
    totalNotes,
  } = props

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
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
          {hasExercise && (
            <ProgressBar index={currentNoteIndex} total={totalNotes} progress={progress} />
          )}
        </div>
        <div className="flex items-center gap-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Tempo:</span>
            <input
              type="range"
              min="40"
              max="200"
              value={bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value))}
              className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
            <span className="min-w-[3rem] text-sm font-bold">{bpm} BPM</span>
          </div>
        </div>
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
