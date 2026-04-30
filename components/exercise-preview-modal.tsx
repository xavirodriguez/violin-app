'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SheetMusic } from '@/components/sheet-music'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { Music, Play, Target, Volume2 } from 'lucide-react'
import type { Exercise, Note } from '@/lib/domain/exercise'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'
import { formatPitchName, MusicalNote } from '@/lib/domain/practice'
import { useState } from 'react'
import { ScoreViewDisplay } from '@/lib/ports/score-view.port'

interface ExercisePreviewModalProps {
  exercise: Exercise | undefined
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStart: () => void
}

export function ExercisePreviewModal({
  exercise,
  isOpen,
  onOpenChange,
  onStart,
}: ExercisePreviewModalProps) {
  const osmdHook = useOSMDSafe(exercise?.musicXML ?? '')
  const [isPlaying, setIsPlaying] = useState(false)

  const playReferenceAudio = async () => {
    if (!exercise || isPlaying) return
    setIsPlaying(true)
    const audioContext = createAudioContext()

    try {
      const totalDuration = scheduleExercisePlayback(exercise, audioContext)
      setTimeout(() => setIsPlaying(false), totalDuration * 1000)
    } catch (err) {
      console.error('Failed to play reference audio:', err)
      setIsPlaying(false)
    }
  }

  if (!exercise) return <></>

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
        <PreviewHeader exercise={exercise} />
        <PreviewScrollContent exercise={exercise} osmdHook={osmdHook} />
        <PreviewFooter isPlaying={isPlaying} onPlay={playReferenceAudio} onStart={onStart} />
      </DialogContent>
    </Dialog>
  )
}

function PreviewHeader({ exercise }: { exercise: Exercise }) {
  const { name, category, difficulty, estimatedDuration } = exercise
  return (
    <DialogHeader className="p-6 pb-2">
      <DialogTitle className="text-2xl font-bold">{name}</DialogTitle>
      <DialogDescription>
        {category} • {difficulty} • {estimatedDuration}
      </DialogDescription>
    </DialogHeader>
  )
}

function PreviewScrollContent({
  exercise,
  osmdHook,
}: {
  exercise: Exercise
  osmdHook: ScoreViewDisplay
}) {
  return (
    <ScrollArea className="flex-1 p-6 pt-2">
      <div className="space-y-8">
        <SheetMusicSection display={osmdHook} />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <TechnicalGoalsSection exercise={exercise} />
          <FingerPositionSection />
        </div>
      </div>
    </ScrollArea>
  )
}

function SheetMusicSection({ display }: { display: ScoreViewDisplay }) {
  return (
    <section>
      <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Music className="text-primary h-5 w-5" />
        Sheet Music
      </h4>
      <div className="min-h-[300px] overflow-hidden rounded-xl border bg-white">
        <SheetMusic
          containerRef={display.containerRef}
          isReady={display.isReady}
          error={display.error}
        />
      </div>
    </section>
  )
}

function TechnicalGoalsSection({ exercise }: { exercise: Exercise }) {
  return (
    <section className="space-y-4">
      <h4 className="flex items-center gap-2 text-lg font-semibold">
        <Target className="text-primary h-5 w-5" />
        Technical Goals
      </h4>
      <div className="bg-muted/30 rounded-xl border p-4">
        <ul className="space-y-3">
          {exercise.technicalGoals.map((goal, idx) => (
            <GoalListItem key={idx} goal={goal} />
          ))}
        </ul>
      </div>
      <p className="text-lg font-semibold">{exercise.technicalTechnique}</p>
    </section>
  )
}

function GoalListItem({ goal }: { goal: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <div className="bg-primary/10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
        <GoalCheckIcon className="text-primary h-3 w-3" />
      </div>
      {goal}
    </li>
  )
}

function FingerPositionSection() {
  return (
    <section className="space-y-4">
      <h4 className="flex items-center gap-2 text-lg font-semibold">Finger Position Guide</h4>
      <div className="bg-card flex h-full flex-col justify-center rounded-xl border p-4">
        <ViolinFingerboard
          targetNote={undefined}
          detectedPitchName={undefined}
          centsDeviation={undefined}
        />
      </div>
    </section>
  )
}

function PreviewFooter({
  isPlaying,
  onPlay,
  onStart,
}: {
  isPlaying: boolean
  onPlay: () => void
  onStart: () => void
}) {
  return (
    <DialogFooter className="bg-muted/20 flex flex-row items-center gap-4 border-t p-6 sm:justify-between">
      <Button variant="outline" onClick={onPlay} disabled={isPlaying} className="gap-2">
        {isPlaying ? <PlayingIndicator /> : <Volume2 className="h-4 w-4" />}
        {isPlaying ? 'Playing...' : 'Listen Reference'}
      </Button>
      <Button onClick={onStart} size="lg" className="gap-2 px-8 font-bold">
        <Play className="h-4 w-4" /> Start Practice
      </Button>
    </DialogFooter>
  )
}

function PlayingIndicator() {
  return <div className="bg-primary h-4 w-4 animate-pulse rounded-full" />
}

function createAudioContext(): AudioContext {
  const WinAudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const context = new WinAudioContext()
  const result = context

  return result
}

function scheduleExercisePlayback(exercise: Exercise, context: AudioContext): number {
  let currentTime = context.currentTime
  const bpm = exercise.tempoRange?.min ?? 120

  for (const note of exercise.notes) {
    const durationSeconds = calculateNoteDuration(note.duration, bpm)
    const frequency = getNoteFrequency(note)

    scheduleNotePlayback({ context, frequency, startTime: currentTime, duration: durationSeconds })
    currentTime += durationSeconds + 0.02
  }

  const finalDuration = currentTime - context.currentTime
  return finalDuration
}

function calculateNoteDuration(duration: number, bpm: number): number {
  const beatsPerWholeNote = 4
  const secondsPerMinute = 60
  const durationSeconds = (beatsPerWholeNote / duration) * (secondsPerMinute / bpm)

  return durationSeconds
}

function getNoteFrequency(note: Note): number {
  const noteName = formatPitchName(note.pitch)
  const musicalNote = MusicalNote.fromName(noteName)
  const frequency = musicalNote.frequency

  return frequency
}

function scheduleNotePlayback(params: {
  context: AudioContext
  frequency: number
  startTime: number
  duration: number
}): void {
  const { context, frequency, startTime, duration } = params
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(frequency, startTime)

  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

function GoalCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
