import { formatPitchName, type PracticeState, type PracticeEvent } from '@/lib/practice-core'
import { createPracticeEngine } from '../practice-engine/engine'
import { PracticeEngineEvent } from '../practice-engine/engine.types'
import { engineReducer } from '../practice-engine/engine.reducer'
import { handlePracticeEvent } from './practice-event-sink'
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { featureFlags } from '@/lib/feature-flags'
import type { Exercise } from '@/lib/exercises/types'
import { NoteTechnique } from '../technique-types'

/**
 * Result of a completed or cancelled practice session runner execution.
 *
 * @public
 */
export interface SessionResult {
  /** Whether the session finished naturally (reached the end of the exercise). */
  completed: boolean
  /** The reason why the session ended. */
  reason: 'finished' | 'cancelled' | 'error'
  /** The error object if the session ended due to an error. */
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

import { Observation } from '../technique-types'

export interface SessionRunnerDependencies {
  /** The source of audio frames. */
  audioLoop: AudioLoopPort
  /** The pitch detector for analysis. */
  detector: PitchDetectionPort
  /** The exercise to be practiced. */
  exercise: Exercise
  /** Unix timestamp of when the session was initiated. */
  sessionStartTime: number
  /** Minimal store interface for state management and communication. */
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
    /** Stops the session and cleans up resources. */
    stop: () => Promise<void>
  }
  /** Analytics handlers for recording progress. */
  analytics: {
    /** Ends the analytics session. */
    endSession: () => void
    /** Records an individual note attempt. */
    recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void
    /** Records the completion of a note. */
    recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void
  }
  /** Optional callback to update real-time pitch feedback in the UI. */
  updatePitch?: (pitch: number, confidence: number) => void
}

/**
 * Implementation of {@link PracticeSessionRunner} that orchestrates the Practice Engine
 * and synchronizes with the application stores.
 *
 * @remarks
 * This class acts as the "glue" between the pure domain logic of the `PracticeEngine`
 * and the external world (audio hardware, analytics, Zustand stores).
 * It manages its own internal {@link AbortController} for graceful shutdown.
 *
 * @public
 */
export class PracticeSessionRunnerImpl implements PracticeSessionRunner {
  private controller: AbortController | null = null
  private loopState = { lastDispatchedNoteIndex: -1, currentNoteStartedAt: Date.now() }

  /**
   * Creates an instance of PracticeSessionRunnerImpl.
   *
   * @param deps - The dependencies required for orchestration.
   */
  constructor(private deps: SessionRunnerDependencies) {}

  /**
   * Executes the session loop.
   *
   * @param signal - External abort signal.
   * @returns The session outcome.
   */
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

  /**
   * Cancels the current execution and triggers cleanup.
   */
  cancel(): void {
    this.controller?.abort()
    this.controller = null
  }

  /**
   * Performs internal cleanup of session-specific resources.
   */
  private cleanup(): void {
    // No-op cleanup
  }

  /**
   * Internal async loop that consumes events from the Practice Engine.
   *
   * @param signal - Abort signal for the loop.
   */
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

  /**
   * Processes a single practice event, updating state and triggering side effects.
   *
   * @param event - The event to process.
   * @param signal - Current session signal.
   */
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

  /**
   * Handles side effects specific to matching a note, such as recording analytics.
   *
   * @param event - The match event.
   * @param currentState - The current domain state.
   */
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
 * Runs a practice session using the provided dependencies.
 *
 * @deprecated Use `PracticeSessionRunnerImpl` directly for better lifecycle management.
 *
 * @param deps - Session dependencies.
 * @returns A promise with the session result.
 */
export async function runPracticeSession(deps: SessionRunnerDependencies) {
  const runner = new PracticeSessionRunnerImpl(deps)
  return runner.run(new AbortController().signal)
}
