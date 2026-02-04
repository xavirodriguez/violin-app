import { formatPitchName, type PracticeState, type PracticeEvent } from '@/lib/practice-core'
import { createPracticeEngine } from '../practice-engine/engine'
import { PracticeEngineEvent } from '../practice-engine/engine.types'
import { engineReducer } from '../practice-engine/engine.reducer'
import { handlePracticeEvent } from './practice-event-sink'
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

import { Observation } from '../technique-types'

export interface SessionRunnerDependencies {
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  exercise: Exercise
  sessionStartTime: number
  store: {
    getState: () => { practiceState: PracticeState | null; liveObservations?: Observation[] }
    setState: (
      partial:
        | { practiceState: PracticeState | null; liveObservations?: Observation[] }
        | Partial<{ practiceState: PracticeState | null; liveObservations?: Observation[] }>
        | ((state: {
            practiceState: PracticeState | null
            liveObservations?: Observation[]
          }) =>
            | { practiceState: PracticeState | null; liveObservations?: Observation[] }
            | Partial<{ practiceState: PracticeState | null; liveObservations?: Observation[] }>),
      replace?: boolean
    ) => void
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
    const { audioLoop, detector, exercise } = this.deps

    const engine = createPracticeEngine({
      audio: audioLoop,
      pitch: detector,
      exercise,
      reducer: engineReducer,
    })

    const engineEvents = engine.start(signal)

    for await (const event of engineEvents) {
      if (signal.aborted) break

      // Adapt PracticeEngineEvent back to PracticeEvent for compatibility
      const practiceEvent: PracticeEvent = this.mapEngineEventToPracticeEvent(event)
      this.processEvent(practiceEvent, signal)
    }
  }

  private mapEngineEventToPracticeEvent(event: PracticeEngineEvent): PracticeEvent {
    switch (event.type) {
      case 'NOTE_DETECTED':
        return { type: 'NOTE_DETECTED', payload: event.payload }
      case 'HOLDING_NOTE':
        return { type: 'HOLDING_NOTE', payload: event.payload }
      case 'NOTE_MATCHED':
        return { type: 'NOTE_MATCHED', payload: event.payload }
      case 'NO_NOTE':
        return { type: 'NO_NOTE_DETECTED' }
      default:
        return { type: 'NO_NOTE_DETECTED' }
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
