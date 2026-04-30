'use client'

import { useEffect, useRef } from 'react'
import {
  createRawPitchStream,
  createPracticeEventPipeline,
  type PipelineContext,
  type NoteStreamOptions,
} from '@/lib/note-stream'
import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port'
import type { PracticeState, PracticeEvent } from '@/lib/practice-core'
import type { Exercise } from '@/lib/exercises/types'
import { useProgressStore } from '@/stores/progress.store'

interface PipelineDependencies {
  state: PracticeState
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  signal: AbortSignal
}

function getPipelineContext(state: PracticeState): PipelineContext {
  const note = state.exercise.notes[state.currentIndex]
  const result: PipelineContext = {
    targetNote: note,
    currentIndex: state.currentIndex,
    sessionStartTime: Date.now(),
  }

  return result
}

function getPipelineOptions(state: PracticeState): NoteStreamOptions & { exercise: Exercise } {
  const skill = useProgressStore.getState().intonationSkill
  const tolerance = 35 - (skill / 100) * 25
  const options = {
    minRms: 0.015,
    minConfidence: 0.8,
    centsTolerance: Math.round(tolerance),
    requiredHoldTime: 180,
    exercise: state.exercise,
    bpm: 60,
  }

  return options
}

async function startPipeline(
  deps: PipelineDependencies,
  consume: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>,
) {
  const { state, audioLoop, detector, signal } = deps
  const rawPitchStream = createRawPitchStream({ audioLoop, detector, signal })
  const eventPipeline = createPracticeEventPipeline({
    rawPitchStream,
    context: getPipelineContext(state),
    options: getPipelineOptions(state),
    signal,
  })

  const result = await consume(eventPipeline)
  return result
}

/**
 * Hook to encapsulate the high-frequency audio pipeline lifecycle.
 * Refactored to satisfy Senior Software Craftsmanship 5-15 line limits.
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
    const isReady = practiceState?.status === 'listening' && audioLoop && detector
    if (!isReady) return

    const abortController = new AbortController()
    runPipelineSession({
      deps: {
        state: practiceState!,
        audioLoop: audioLoop!,
        detector: detector!,
        signal: abortController.signal,
      },
      consume: consumePipelineEvents,
    })

    const cleanup = () => abortController.abort()
    return cleanup
  }, [
    practiceState?.status,
    practiceState?.currentIndex,
    audioLoop,
    detector,
    consumePipelineEvents,
    practiceState?.exercise?.id,
  ])
}

function runPipelineSession(params: {
  deps: PipelineDependencies
  consume: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}) {
  const { deps, consume } = params
  startPipeline(deps, consume).catch((error) => {
    const isAbort = error instanceof Error && error.name === 'AbortError'
    if (isAbort) return

    const logMessage = `[PracticeMode] Pipeline error: ${error}`
    console.error(logMessage)
  })
}
