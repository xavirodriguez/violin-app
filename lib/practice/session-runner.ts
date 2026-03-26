import { formatPitchName, type PracticeState, type PracticeEvent } from '@/lib/practice-core'
import { createPracticeEngine } from '../practice-engine/engine'
import { PracticeEngineEvent } from '../practice-engine/engine.types'
import { engineReducer } from '../practice-engine/engine.reducer'
import { handlePracticeEvent } from './practice-event-sink'
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import type { Exercise } from '@/lib/exercises/types'
import { NoteTechnique, Observation } from '../technique-types'

/**
 * Result of a completed or cancelled practice session runner execution.
 *
 * @public
 */
export interface SessionResult {
  completed: boolean
  reason: 'finished' | 'cancelled' | 'error'
  error?: Error
}

/**
 * Interface for the practice session runner, responsible for coordinating the audio
 * loop, pitch detection, and state updates during a session.
 *
 * @public
 */
export interface PracticeSessionRunner {
  /**
   * Starts the practice session and runs until completion, cancellation, or error.
   *
   * @param signal - An external {@link AbortSignal} to cancel the session.
   * @returns A promise that resolves with the {@link SessionResult}.
   */
  run(signal: AbortSignal): Promise<SessionResult>

  /**
   * Immediately stops the running session.
   */
  cancel(): void
}

/**
 * Minimal store interface for state management and UI synchronization.
 * @internal
 */
export interface RunnerStore {
  getState: () => { practiceState: PracticeState | undefined; liveObservations?: Observation[] }
  setState: (
    partial:
      | { practiceState: PracticeState | undefined; liveObservations?: Observation[] }
      | Partial<{ practiceState: PracticeState | undefined; liveObservations?: Observation[] }>
      | ((state: {
          practiceState: PracticeState | undefined
          liveObservations?: Observation[]
        }) =>
          | { practiceState: PracticeState | undefined; liveObservations?: Observation[] }
          | Partial<{
              practiceState: PracticeState | undefined
              liveObservations?: Observation[]
            }>),
    replace?: boolean,
  ) => void
  stop: () => Promise<void>
}

/**
 * Analytics handlers for recording performance metrics.
 * @internal
 */
export interface RunnerAnalytics {
  endSession: () => void
  recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void
  recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void
}

/**
 * Dependencies required by the {@link PracticeSessionRunnerImpl}.
 *
 * @public
 */
export interface SessionRunnerDependencies {
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  exercise: Exercise
  sessionStartTime: number
  store: RunnerStore
  analytics: RunnerAnalytics
  updatePitch?: (pitch: number, confidence: number) => void
}

/**
 * Implementation of {@link PracticeSessionRunner} that orchestrates the Practice Engine
 * and synchronizes with the application stores.
 *
 * @public
 */
export class PracticeSessionRunnerImpl implements PracticeSessionRunner {
  private abortController: AbortController | undefined
  private sessionStats = { lastProcessedIndex: -1, noteStartTime: Date.now() }
  private environment: SessionRunnerDependencies

  constructor(environment: SessionRunnerDependencies) {
    const hasEnvironment = !!environment
    if (!hasEnvironment) {
      throw new Error('Environment is required')
    }
    this.environment = environment
  }

  async run(externalSignal: AbortSignal): Promise<SessionResult> {
    this.cancel()
    this.abortController = new AbortController()

    const onAbort = () => this.cancel()
    externalSignal.addEventListener('abort', onAbort)

    try {
      await this.executeLoop(this.abortController.signal)
      return this.determineResult(externalSignal)
    } catch (error) {
      return this.handleRunError(error)
    } finally {
      externalSignal.removeEventListener('abort', onAbort)
    }
  }

  cancel(): void {
    const controller = this.abortController
    const hasController = !!controller

    if (hasController) {
      controller.abort()
    }
  }

  private determineResult(signal: AbortSignal): SessionResult {
    const abortedInternal = !!this.abortController?.signal.aborted
    const abortedExternal = signal.aborted
    const isCancelled = abortedInternal || abortedExternal

    return {
      completed: !isCancelled,
      reason: isCancelled ? 'cancelled' : 'finished',
    }
  }

  private handleRunError(error: unknown): SessionResult {
    const isAbort =
      error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')

    if (isAbort) {
      return { completed: false, reason: 'cancelled' }
    }

    console.error('[Runner] Session execution failed:', error)
    const errorResult: SessionResult = { completed: false, reason: 'error', error: error as Error }
    return errorResult
  }

  private async executeLoop(signal: AbortSignal): Promise<void> {
    const engine = createPracticeEngine({
      audio: this.environment.audioLoop,
      pitch: this.environment.detector,
      exercise: this.environment.exercise,
      reducer: engineReducer,
    })

    for await (const event of engine.start(signal)) {
      if (signal.aborted) break
      this.processEngineEvent(event, signal)
    }
  }

  private processEngineEvent(event: PracticeEngineEvent, signal: AbortSignal): void {
    const legacyEvent = this.mapToLegacyEvent(event)
    const contextSignal = signal

    this.dispatchInternalEvent(legacyEvent, contextSignal)
  }

  private mapToLegacyEvent(event: PracticeEngineEvent): PracticeEvent {
    if (event.type === 'NOTE_DETECTED') {
      return { type: 'NOTE_DETECTED', payload: event.payload }
    }
    if (event.type === 'HOLDING_NOTE') {
      return { type: 'HOLDING_NOTE', payload: event.payload }
    }
    if (event.type === 'NOTE_MATCHED') {
      return { type: 'NOTE_MATCHED', payload: event.payload }
    }
    return { type: 'NO_NOTE_DETECTED' }
  }

  private dispatchInternalEvent(event: PracticeEvent, signal: AbortSignal): void {
    const state = this.environment.store.getState().practiceState
    const isReady = !!event.type && !!state

    if (!isReady) return

    this.synchronizeFeedback(event)
    if (signal.aborted) return

    this.handleEventCompletion(event, state!)
    this.propagateToEventSink(event)
  }

  private synchronizeFeedback(event: PracticeEvent): void {
    const isDetected = event.type === 'NOTE_DETECTED'
    const isNotDetected = event.type === 'NO_NOTE_DETECTED'

    if (isDetected) {
      this.environment.updatePitch?.(event.payload.pitchHz, event.payload.confidence)
      this.logTelemetry(event.payload)
    } else if (isNotDetected) {
      this.environment.updatePitch?.(0, 0)
    }
  }

  private handleEventCompletion(event: PracticeEvent, state: PracticeState): void {
    const isMatched = event.type === 'NOTE_MATCHED'

    if (isMatched) {
      const matchedEvent = event as Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>
      this.recordNoteMilestone(matchedEvent, state)
    }
  }

  private propagateToEventSink(event: PracticeEvent): void {
    const sinkParams = {
      event,
      store: this.environment.store,
      onCompleted: () => void this.environment.store.stop(),
      analytics: this.environment.analytics,
    }

    handlePracticeEvent(sinkParams)
  }

  private logTelemetry(payload: {
    pitch: string
    cents: number
    confidence: number
    timestamp: number
  }): void {
    const telemetryData = {
      pitch: payload.pitch,
      cents: payload.cents,
      confidence: payload.confidence,
      timestamp: payload.timestamp,
    }

    console.log('[TELEMETRY] Pitch Accuracy:', telemetryData)
  }

  private recordNoteMilestone(
    event: Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>,
    state: PracticeState,
  ): void {
    const index = state.currentIndex
    const note = state.exercise.notes[index]

    if (!note || index === this.sessionStats.lastProcessedIndex) return

    const duration = Date.now() - this.sessionStats.noteStartTime
    this.emitAnalytics({ index, note, duration, technique: event.payload?.technique })
    this.updateRunnerStats(index)
  }

  private emitAnalytics(params: {
    index: number
    note: any
    duration: number
    technique: any
  }): void {
    const { index, note, duration, technique } = params
    const pitch = formatPitchName(note.pitch)
    this.environment.analytics.recordNoteAttempt(index, pitch, 0, true)
    this.environment.analytics.recordNoteCompletion(index, duration, technique)
  }

  private updateRunnerStats(index: number): void {
    const nextStats = {
      lastProcessedIndex: index,
      noteStartTime: Date.now(),
    }

    this.sessionStats = nextStats
  }
}

/**
 * @deprecated Use `PracticeSessionRunnerImpl` directly.
 */
export async function runPracticeSession(deps: SessionRunnerDependencies): Promise<SessionResult> {
  const runner = new PracticeSessionRunnerImpl(deps)
  const controller = new AbortController()
  const signal = controller.signal

  const result = await runner.run(signal)
  return result
}
