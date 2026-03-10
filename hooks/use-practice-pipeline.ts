'use client'

import { useEffect } from 'react'
import {
  createRawPitchStream,
  createPracticeEventPipeline,
  type PipelineContext,
  type NoteStreamOptions,
} from '@/lib/note-stream'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import type { PracticeState, PracticeEvent } from '@/lib/practice-core'
import type { Exercise } from '@/lib/exercises/types'

interface PipelineDependencies {
  state: PracticeState
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  signal: AbortSignal
}

function getPipelineContext(state: PracticeState): PipelineContext {
  return {
    targetNote: state.exercise.notes[state.currentIndex],
    currentIndex: state.currentIndex,
    sessionStartTime: Date.now(),
  }
}

function getPipelineOptions(state: PracticeState): NoteStreamOptions & { exercise: Exercise } {
  return {
    minRms: 0.015,
    minConfidence: 0.85,
    centsTolerance: 20,
    requiredHoldTime: 500,
    exercise: state.exercise,
    bpm: 60,
  }
}

async function startPipeline(
  deps: PipelineDependencies,
  consume: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
) {
  const { state, audioLoop, detector, signal } = deps
  const rawPitchStream = createRawPitchStream({ audioLoop, detector, signal })
  const eventPipeline = createPracticeEventPipeline({
    rawPitchStream,
    context: getPipelineContext(state),
    options: getPipelineOptions(state),
    signal,
  })
  return consume(eventPipeline)
}

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
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}) {
  useEffect(() => {
    if (practiceState?.status !== 'listening' || !audioLoop || !detector) return

    const abortController = new AbortController()
    startPipeline(
      { state: practiceState, audioLoop, detector, signal: abortController.signal },
      consumePipelineEvents
    ).catch((error) => {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('[PracticeMode] Pipeline error:', error)
    })

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
