'use client'

import { Play, Square, RotateCcw, Volume2, Timer, Repeat } from 'lucide-react'
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
  isLooping?: boolean
  onToggleLoop?: () => void
  startNoteIndex: number
  endNoteIndex: number
  onRangeChange?: (start: number, end: number) => void
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
    visualBeat,
    isLooping,
    onToggleLoop,
    startNoteIndex,
    endNoteIndex,
    onRangeChange,
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
            visualBeat={visualBeat}
          />
          {hasExercise && (
            <ProgressBar index={currentNoteIndex} total={totalNotes} progress={progress} />
          )}
        </div>
        <div className="flex items-center gap-8 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tempo</span>
            <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
              <input
                type="range"
                min="40"
                max="200"
                value={bpm}
                onChange={(e) => onBpmChange(parseInt(e.target.value))}
                className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <span className="min-w-[3rem] text-sm font-bold tabular-nums">{bpm} BPM</span>
            </div>
          </div>

          {hasExercise && (
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Range</span>
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-md border border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground leading-none">Start</span>
                    <input
                      type="number"
                      min="1"
                      max={totalNotes}
                      value={startNoteIndex + 1}
                      onChange={(e) => onRangeChange?.(parseInt(e.target.value) - 1, endNoteIndex)}
                      className="w-12 bg-transparent text-sm font-bold focus:outline-none"
                    />
                  </div>
                  <div className="h-6 w-px bg-border/50" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground leading-none">End</span>
                    <input
                      type="number"
                      min="1"
                      max={totalNotes}
                      value={endNoteIndex + 1}
                      onChange={(e) => onRangeChange?.(startNoteIndex, parseInt(e.target.value) - 1)}
                      className="w-12 bg-transparent text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <Button
                variant={isLooping ? "default" : "outline"}
                size="sm"
                onClick={onToggleLoop}
                className="h-9 gap-2 px-4 transition-all"
              >
                <Repeat className="h-4 w-4" />
                {isLooping ? 'Looping On' : 'Loop Off'}
              </Button>
            </div>
          )}
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
