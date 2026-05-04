'use client'

import React from 'react'
import { usePracticeStore } from '@/stores/practice-store'
import { Button } from '@/components/ui/button'
import { Repeat } from 'lucide-react'

export function LoopSelector() {
  const { practiceState, setLoopRegion, loopRegion } = usePracticeStore()

  if (!practiceState) return null

  const toggleLoop = () => {
    if (loopRegion?.isEnabled) {
      setLoopRegion(undefined)
    } else {
      // Default loop for demonstration: first 4 notes
      setLoopRegion({
        startNoteIndex: 0,
        endNoteIndex: 3,
        isEnabled: true,
      })
    }
  }

  return (
    <Button
      variant={loopRegion?.isEnabled ? 'default' : 'outline'}
      size="sm"
      onClick={toggleLoop}
      title="Toggle loop (first 4 notes)"
    >
      <Repeat className="mr-2 h-4 w-4" />
      Loop
    </Button>
  )
}
