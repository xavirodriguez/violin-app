import { formatPitchName, type PracticeState, type PracticeEvent } from '@/lib/practice-core'
import { createPracticeEngine } from '../practice-engine/engine'
import { PracticeEngineEvent } from '../practice-engine/engine.types'
import { engineReducer } from '../practice-engine/engine.reducer'
import { handlePracticeEvent } from './practice-event-sink'
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types'
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
  centsTolerance?: number
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
    const dependencies = environment
    const hasEnvironment = !!dependencies
    if (!hasEnvironment) {
      throw new Error('Environment is required')
    }

    this.environment = dependencies
  }

  async run(externalSignal: AbortSignal): Promise<SessionResult> {
    this.cancel()
    const controller = new AbortController()
    this.abortController = controller

    const onAbort = () => this.cancel()
    externalSignal.addEventListener('abort', onAbort)

    try {
      await this.executeLoop(controller.signal)
      const result = this.determineResult(externalSignal)
      return result
    } catch (error) {
      const errorResult = this.handleRunError(error)
      return errorResult
    } finally {
      externalSignal.removeEventListener('abort', onAbort)
    }
  }

  cancel(): void {
    const activeController = this.abortController
    const hasController = !!activeController
    const isAborted = activeController?.signal.aborted

    if (hasController && !isAborted) {
      activeController.abort()
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
    const context = this.environment
    const engine = createPracticeEngine({
      audio: context.audioLoop,
      pitch: context.detector,
      exercise: context.exercise,
      reducer: engineReducer,
      centsTolerance: context.centsTolerance ?? 25,
    })

    for await (const event of engine.start(signal)) {
      const isTerminated = signal.aborted
      if (isTerminated) break
      this.processEngineEvent(event, signal)
    }
  }

  private processEngineEvent(event: PracticeEngineEvent, signal: AbortSignal): void {
    const legacyEvent = this.mapToLegacyEvent(event)
    const contextSignal = signal

    this.dispatchInternalEvent(legacyEvent, contextSignal)
  }

  private mapToLegacyEvent(event: PracticeEngineEvent): PracticeEvent {
    const type = event.type
    if (type === 'NOTE_DETECTED') {
      return { type: 'NOTE_DETECTED', payload: event.payload }
    }
    if (type === 'HOLDING_NOTE') {
      return { type: 'HOLDING_NOTE', payload: event.payload }
    }
    if (type === 'NOTE_MATCHED') {
      return { type: 'NOTE_MATCHED', payload: event.payload }
    }

    const fallback: PracticeEvent = { type: 'NO_NOTE_DETECTED' }
    return fallback
  }

  private dispatchInternalEvent(event: PracticeEvent, signal: AbortSignal): void {
    const state = this.environment.store.getState().practiceState
    const hasEvent = !!event.type
    const isReady = hasEvent && !!state

    if (!isReady || !state) return

    this.synchronizeFeedback(event)
    if (signal.aborted) return

    this.handleEventCompletion(event, state)
    this.propagateToEventSink(event)
  }

  private synchronizeFeedback(event: PracticeEvent): void {
    const updatePitch = this.environment.updatePitch
    const isDetected = event.type === 'NOTE_DETECTED'
    const isNotDetected = event.type === 'NO_NOTE_DETECTED'

    if (isDetected) {
      updatePitch?.(event.payload.pitchHz, event.payload.confidence)
      this.logTelemetry(event.payload)
    } else if (isNotDetected) {
      updatePitch?.(0, 0)
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
    const dependencies = this.environment
    const sinkParams = {
      event,
      store: dependencies.store,
      onCompleted: () => void dependencies.store.stop(),
      analytics: dependencies.analytics,
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

    const logPrefix = '[TELEMETRY] Pitch Accuracy:'
    console.log(logPrefix, telemetryData)
  }

  private recordNoteMilestone(
    event: Extract<PracticeEvent, { type: 'NOTE_MATCHED' }>,
    state: PracticeState,
  ): void {
    const index = state.currentIndex
    const note = state.exercise.notes[index]
    const isNewNote = index !== this.sessionStats.lastProcessedIndex

    if (note && isNewNote) {
      const duration = Date.now() - this.sessionStats.noteStartTime
      const technique = event.payload?.technique
      this.emitAnalytics({ index, note, duration, technique })
      this.updateRunnerStats(index)
    }
  }

  private emitAnalytics(params: {
    index: number
    note: TargetNote
    duration: number
    technique: NoteTechnique | undefined
  }): void {
    const { index, note, duration, technique } = params
    const pitch = formatPitchName(note.pitch)
    const analytics = this.environment.analytics

    analytics.recordNoteAttempt(index, pitch, 0, true)
    analytics.recordNoteCompletion(index, duration, technique)
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
