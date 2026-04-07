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
import { Music, Play, Target, ListCheck, Volume2 } from 'lucide-react'
import type { Exercise } from '@/lib/domain/musical-types'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'
import { formatPitchName, MusicalNote } from '@/lib/practice-core'
import { useState } from 'react'

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
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    try {
      let currentTime = audioContext.currentTime

      for (const note of exercise.notes) {
        const noteName = formatPitchName(note.pitch)
        const musicalNote = MusicalNote.fromName(noteName)
        const freq = musicalNote.frequency
        const bpm = 120
        const durationSeconds = (4 / note.duration) * (60 / bpm)

        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, currentTime)

        gain.gain.setValueAtTime(0, currentTime)
        gain.gain.linearRampToValueAtTime(0.15, currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + durationSeconds)

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.start(currentTime)
        osc.stop(currentTime + durationSeconds)

        currentTime += durationSeconds + 0.02
      }

      // Reset isPlaying after total duration
      const totalDuration = currentTime - audioContext.currentTime
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
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold">{exercise.name}</DialogTitle>
          <DialogDescription>
            {exercise.category} • {exercise.difficulty} • {exercise.estimatedDuration}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6 pt-2">
          <div className="space-y-8">
            <section>
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Music className="text-primary h-5 w-5" />
                Sheet Music
              </h4>
              <div className="min-h-[300px] overflow-hidden rounded-xl border bg-white">
                <SheetMusic
                  containerRef={osmdHook.containerRef}
                  isReady={osmdHook.isReady}
                  error={osmdHook.error}
                />
              </div>
            </section>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-lg font-semibold">
                  <Target className="text-primary h-5 w-5" />
                  Technical Goals
                </h4>
                <div className="bg-muted/30 rounded-xl border p-4">
                  <ul className="space-y-3">
                    {exercise.technicalGoals.map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <div className="bg-primary/10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                          <CheckIcon className="text-primary h-3 w-3" />
                        </div>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-lg font-semibold">{exercise.technicalTechnique}</p>
              </section>
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-lg font-semibold">
                  Finger Position Guide
                </h4>
                <div className="bg-card flex h-full flex-col justify-center rounded-xl border p-4">
                  <ViolinFingerboard
                    targetNote={undefined}
                    detectedPitchName={undefined}
                    centsDeviation={undefined}
                  />
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="bg-muted/20 flex flex-row items-center gap-4 border-t p-6 sm:justify-between">
          <Button
            variant="outline"
            onClick={playReferenceAudio}
            disabled={isPlaying}
            className="gap-2"
          >
            {isPlaying ? (
              <div className="bg-primary h-4 w-4 animate-pulse rounded-full" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            {isPlaying ? 'Playing...' : 'Listen Reference'}
          </Button>
          <Button onClick={onStart} size="lg" className="gap-2 px-8 font-bold">
            <Play className="h-4 w-4" /> Start Practice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
