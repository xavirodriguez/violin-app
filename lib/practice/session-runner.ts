import { formatPitchName, type PracticeState, type PracticeEvent } from '@/lib/practice-core'
import { createPracticeEngine } from '../practice-engine/engine'
import { PracticeEngineEvent } from '../practice-engine/engine.types'
import { engineReducer } from '../practice-engine/engine.reducer'
import { handlePracticeEvent } from './practice-event-sink'
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import type { Exercise, Note as TargetNote } from '@/lib/exercises/types'
import { NoteTechnique, Observation } from '../technique-types'
import { featureFlags } from '../feature-flags'

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
      | ((state: { practiceState: PracticeState | undefined; liveObservations?: Observation[] }) =>
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

    const executionParams = { internalSignal: controller.signal, externalSignal, onAbort }
    const result = await this.executeSession(executionParams)

    return result
  }

  private async executeSession(params: {
    internalSignal: AbortSignal
    externalSignal: AbortSignal
    onAbort: () => void
  }): Promise<SessionResult> {
    const { internalSignal, externalSignal, onAbort } = params
    try {
      await this.executeLoop(internalSignal)
      const finalResult = this.determineResult(externalSignal)
      return finalResult
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

    const result: SessionResult = {
      completed: !isCancelled,
      reason: isCancelled ? 'cancelled' : 'finished',
    }
    return result
  }

  private handleRunError(error: unknown): SessionResult {
    const isAbort =
      error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')

    if (isAbort) {
      const cancelled: SessionResult = { completed: false, reason: 'cancelled' }
      return cancelled
    }

    console.error('[Runner] Session execution failed:', error)
    const errorResult: SessionResult = { completed: false, reason: 'error', error: error as Error }
    return errorResult
  }

  private async executeLoop(signal: AbortSignal): Promise<void> {
    const engine = this.initializeEngine()
    const events = engine.start(signal)

    for await (const event of events) {
      const isTerminated = signal.aborted
      if (isTerminated) break
      this.processEngineEvent(event, signal)
    }
  }

  private initializeEngine() {
    const context = this.environment
    const storeState = context.store.getState()
    const engine = createPracticeEngine({
      audio: context.audioLoop,
      pitch: context.detector,
      exercise: context.exercise,
      reducer: engineReducer,
      centsTolerance: context.centsTolerance ?? 25,
      initialNoteIndex: storeState.practiceState?.currentIndex ?? 0,
    })

    return engine
  }

  private processEngineEvent(event: PracticeEngineEvent, signal: AbortSignal): void {
    const legacyEvent = this.mapToLegacyEvent(event)
    const contextSignal = signal

    this.dispatchInternalEvent(legacyEvent, contextSignal)
  }

  private mapToLegacyEvent(event: PracticeEngineEvent): PracticeEvent {
    const type = event.type
    const isDetection = type === 'NOTE_DETECTED' || type === 'HOLDING_NOTE'
    if (isDetection) {
      return { type, payload: event.payload } as PracticeEvent
    }

    const isMatch = type === 'NOTE_MATCHED'
    if (isMatch) {
      return { type: 'NOTE_MATCHED', payload: event.payload }
    }

    const fallback: PracticeEvent = { type: 'NO_NOTE_DETECTED' }
    return fallback
  }

  private dispatchInternalEvent(event: PracticeEvent, signal: AbortSignal): void {
    const state = this.environment.store.getState().practiceState
    const isReady = !!event.type && !!state

    if (!isReady || !state) return

    this.synchronizeFeedback(event)
    const isInterrupted = signal.aborted
    if (isInterrupted) return

    this.handleEventOutcome(event, state)
  }

  private handleEventOutcome(event: PracticeEvent, state: PracticeState): void {
    this.handleEventCompletion(event, state)
    this.propagateToEventSink(event)
  }

  private synchronizeFeedback(event: PracticeEvent): void {
    const updatePitch = this.environment.updatePitch
    const isDetected = event.type === 'NOTE_DETECTED'

    if (isDetected) {
      updatePitch?.(event.payload.pitchHz, event.payload.confidence)
      this.logTelemetry(event.payload)
    } else {
      this.clearFeedback(event.type)
    }
  }

  private clearFeedback(type: string): void {
    const isNoNote = type === 'NO_NOTE_DETECTED'
    if (isNoNote) {
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
    const dependencies = this.environment
    const onCompleted = () => void dependencies.store.stop()
    const sinkParams = {
      event,
      store: dependencies.store,
      onCompleted,
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
    const isEnabled = featureFlags.isEnabled('FEATURE_TELEMETRY_ACCURACY')
    if (!isEnabled) return

    const telemetryData = { ...payload }
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
      const elapsed = Date.now() - this.sessionStats.noteStartTime
      const technique = event.payload?.technique
      const params = { index, note, duration: elapsed, technique }
      this.emitAnalytics(params)
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
    const now = Date.now()
    const nextStats = {
      lastProcessedIndex: index,
      noteStartTime: now,
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
