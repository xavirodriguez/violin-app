import {
  createPracticeEventPipeline as originalCreatePipeline,
  RawPitchEvent,
  PipelineContext,
  NoteStreamOptions,
} from '@/lib/note-stream'
import { PracticeEvent } from '@/lib/practice-core'
import { Exercise } from '@/lib/exercises/types'
import { debugBus } from './debug-event-bus'

export function createPracticeEventPipeline(params: {
  rawPitchStream: AsyncIterable<RawPitchEvent>
  context: PipelineContext
  options: (Partial<NoteStreamOptions> & { exercise: Exercise }) | (() => NoteStreamOptions)
  signal: AbortSignal
  source?: 'hook' | 'runner'
}): AsyncIterable<PracticeEvent> {
  const isDev = process.env.NODE_ENV === 'development'
  const source = params.source || 'hook'

  if (isDev) {
    debugBus.emit({
      type: 'PIPELINE_INSTANCE',
      timestamp: Date.now(),
      source,
      action: 'created',
    })

    const originalPipeline = originalCreatePipeline(params)

    return (async function* () {
      try {
        for await (const event of originalPipeline) {
          debugBus.emit({
            type: 'PRACTICE_EVENT',
            timestamp: Date.now(),
            eventType: event.type,
            currentIndex: params.context.currentIndex,
            status: 'unknown',
          })
          yield event
        }
      } finally {
        debugBus.emit({
          type: 'PIPELINE_INSTANCE',
          timestamp: Date.now(),
          source,
          action: 'destroyed',
        })
      }
    })()
  }

  return originalCreatePipeline(params)
}
