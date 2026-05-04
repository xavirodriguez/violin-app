'use client'

import React from 'react'
import { useAudioStore } from '@/stores/audio-store'
import { Button } from '@/components/ui/button'
import { Headphones, Square } from 'lucide-react'
import { usePracticeStore } from '@/stores/practice-store'

export function ReferencePlayer() {
  const { playReference, stopAll } = useAudioStore()
  const { practiceState } = usePracticeStore()

  const currentNote = practiceState?.exercise.notes[practiceState.currentIndex]

  const handlePlayCurrentNote = () => {
    if (currentNote) {
      // In a real app, we'd need the formatted pitch name
      const noteName = `${currentNote.pitch.step}${currentNote.pitch.octave}`
      playReference(noteName)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlayCurrentNote}
        disabled={!currentNote}
        title="Play current note reference"
      >
        <Headphones className="mr-2 h-4 w-4" />
        Hear Note
      </Button>
      <Button variant="ghost" size="sm" onClick={stopAll} title="Stop all audio">
        <Square className="h-4 w-4" />
      </Button>
    </div>
  )
}
