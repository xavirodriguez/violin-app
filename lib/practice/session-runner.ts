import { formatPitchName, type PracticeState, type PracticeEvent } from '@/lib/practice-core'
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'
import { handlePracticeEvent } from './practice-event-sink'
import { calculateLiveObservations } from '@/lib/live-observations'
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { featureFlags } from '@/lib/feature-flags'
import type { Exercise } from '@/lib/exercises/types'
import { NoteTechnique } from '../technique-types'

export interface SessionResult {
  completed: boolean
  reason: 'finished' | 'cancelled' | 'error'
  error?: Error
}

export interface PracticeSessionRunner {
  run(signal: AbortSignal): Promise<SessionResult>
  cancel(): void
}

export interface SessionRunnerDependencies {
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  exercise: Exercise
  sessionStartTime: number
  store: {
    getState: () => any
    setState: (partial: any) => void
    stop: () => Promise<void>
  }
  analytics: {
    endSession: () => void
    recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void
    recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void
  }
  updatePitch?: (pitch: number, confidence: number) => void
}

export class PracticeSessionRunnerImpl implements PracticeSessionRunner {
  private controller: AbortController | null = null
  private loopState = { lastDispatchedNoteIndex: -1, currentNoteStartedAt: Date.now() }

  constructor(private deps: SessionRunnerDependencies) {}

  async run(signal: AbortSignal): Promise<SessionResult> {
    this.cancel()
    const internalController = new AbortController()
    this.controller = internalController

    const abortHandler = () => this.cancel()
    signal.addEventListener('abort', abortHandler)

    try {
      await this.runInternal(internalController.signal)
      if (internalController.signal.aborted || signal.aborted) {
        return { completed: false, reason: 'cancelled' }
      }
      return { completed: true, reason: 'finished' }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')) {
        return { completed: false, reason: 'cancelled' }
      }
      console.error('[Runner] Unexpected error:', error)
      return { completed: false, reason: 'error', error: error as Error }
    } finally {
      signal.removeEventListener('abort', abortHandler)
      this.cleanup()
    }
  }

  cancel(): void {
    this.controller?.abort()
    this.controller = null
  }

  private cleanup(): void {
    this.controller = null
  }

  private async runInternal(signal: AbortSignal): Promise<void> {
    const { audioLoop, detector, exercise, sessionStartTime } = this.deps

    const targetNoteSelector = () => {
      if (signal.aborted) return null
      const state = this.deps.store.getState().practiceState
      if (!state) return null
      return state.exercise.notes[state.currentIndex] ?? null
    }

    const currentIndexSelector = () => {
      if (signal.aborted) return 0
      return this.deps.store.getState().practiceState?.currentIndex ?? 0
    }

    const rawPitchStream = createRawPitchStream(audioLoop, detector, signal)
    const pipeline = createPracticeEventPipeline(
      rawPitchStream,
      targetNoteSelector,
      currentIndexSelector,
      { exercise, sessionStartTime, bpm: 60 },
      signal
    )

    for await (const event of pipeline) {
      if (signal.aborted) break
      this.processEvent(event, signal)
    }
  }

  private processEvent(event: PracticeEvent, signal: AbortSignal): void {
    if (!event || !event.type) return

    const currentState = this.deps.store.getState().practiceState
    if (!currentState) return

    try {
      if (event.type === 'NOTE_DETECTED') {
        this.deps.updatePitch?.(event.payload.pitchHz, event.payload.confidence)

        // Accuracy Telemetry Evolution
        if (featureFlags.isEnabled('FEATURE_TELEMETRY_ACCURACY')) {
          console.log('[TELEMETRY] Pitch Accuracy:', {
            pitch: event.payload.pitch,
            cents: event.payload.cents,
            confidence: event.payload.confidence,
            timestamp: event.payload.timestamp,
          })
        }
      } else if (event.type === 'NO_NOTE_DETECTED') {
        this.deps.updatePitch?.(0, 0)
      }
    } catch (err) {
      console.warn('[PIPELINE] updatePitch failed', err)
    }

    if (signal.aborted) return

    if (event.type === 'NOTE_MATCHED') {
      this.handleMatchedNoteSideEffects(event, currentState)
    }

    handlePracticeEvent(
      event,
      this.deps.store,
      () => void this.deps.store.stop(),
      this.deps.analytics
    )

    // Handle live observations
    if (event.type === 'NOTE_DETECTED') {
      const state = this.deps.store.getState()
      const practiceState = state.practiceState
      if (practiceState) {
        const targetNote = practiceState.exercise.notes[practiceState.currentIndex]
        if (targetNote) {
          const targetPitchName = formatPitchName(targetNote.pitch)
          const liveObs = calculateLiveObservations(
            practiceState.detectionHistory,
            targetPitchName
          )
          this.deps.store.setState({ liveObservations: liveObs })
        }
      }
    } else if (event.type === 'NOTE_MATCHED') {
      this.deps.store.setState({ liveObservations: [] })
    }
  }

  private handleMatchedNoteSideEffects(
    event: Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>,
    currentState: PracticeState
  ): void {
    const noteIndex = currentState.currentIndex
    const target = currentState.exercise.notes[noteIndex]

    if (target && noteIndex !== this.loopState.lastDispatchedNoteIndex) {
      const timeToComplete = Date.now() - this.loopState.currentNoteStartedAt
      const targetPitch = formatPitchName(target.pitch)

      this.deps.analytics.recordNoteAttempt(noteIndex, targetPitch, 0, true)
      this.deps.analytics.recordNoteCompletion(noteIndex, timeToComplete, event.payload?.technique)

      this.loopState = {
        lastDispatchedNoteIndex: noteIndex,
        currentNoteStartedAt: Date.now()
      }
    }
  }
}

/**
 * @deprecated Use PracticeSessionRunnerImpl directly
 */
export async function runPracticeSession(deps: SessionRunnerDependencies) {
  const runner = new PracticeSessionRunnerImpl(deps)
  return runner.run(new AbortController().signal)
}
