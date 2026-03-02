'use client'

import { useEffect } from 'react'
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import type { Exercise } from '@/lib/exercises/types'
import type { PracticeState } from '@/lib/practice-core'

/**
 * Hook to encapsulate the high-frequency audio pipeline lifecycle.
 */
export function usePracticePipeline({
  practiceState,
  audioLoop,
  detector,
  consumePipelineEvents,
}: {
  practiceState: PracticeState | undefined
  audioLoop: AudioLoopPort | undefined
  detector: PitchDetectionPort | undefined
  consumePipelineEvents: (pipeline: AsyncIterable<any>) => Promise<void>
}) {
  useEffect(() => {
    if (practiceState?.status !== 'listening' || !audioLoop || !detector) return

    const abortController = new AbortController()
    const runPipeline = async () => {
      try {
        const rawPitchStream = createRawPitchStream(audioLoop, detector, abortController.signal)
        const eventPipeline = createPracticeEventPipeline(
          rawPitchStream,
          {
            targetNote: practiceState.exercise.notes[practiceState.currentIndex],
            currentIndex: practiceState.currentIndex,
            sessionStartTime: Date.now(),
          },
          {
            minRms: 0.015,
            minConfidence: 0.85,
            centsTolerance: 20,
            requiredHoldTime: 500,
            exercise: practiceState.exercise,
            bpm: 60,
          },
          abortController.signal
        )
        await consumePipelineEvents(eventPipeline)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('[PracticeMode] Pipeline error:', error)
      }
    }

    runPipeline()
    return () => abortController.abort()
  }, [
    practiceState?.status,
    practiceState?.currentIndex,
    audioLoop,
    detector,
    consumePipelineEvents,
    practiceState?.exercise
  ])
}
