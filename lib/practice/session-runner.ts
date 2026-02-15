import { formatPitchName, type PracticeState, type PracticeEvent } from '@/lib/practice-core'
import { createPracticeEngine } from '../practice-engine/engine'
import { PracticeEngineEvent } from '../practice-engine/engine.types'
import { engineReducer } from '../practice-engine/engine.reducer'
import { handlePracticeEvent } from './practice-event-sink'
import type { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { featureFlags } from '@/lib/feature-flags'
import type { Exercise } from '@/lib/exercises/types'
import { NoteTechnique } from '../technique-types'
import { Observation } from '../technique-types'

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
   * @remarks
   * This is a long-running process that consumes audio data in real-time. It
   * should be executed within a try-catch block to handle unexpected pipeline failures.
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
 * Dependencies required by the {@link PracticeSessionRunnerImpl}.
 *
 * @remarks
 * Uses a Dependency Injection pattern to facilitate testing with mock ports and stores.
 */
interface SessionRunnerDependencies {
  /** The source of audio frames (Hardware/Web Audio). */
  audioLoop: AudioLoopPort
  /** The pitch detector instance for real-time analysis. */
  detector: PitchDetectionPort
  /** The musical exercise to be practiced. */
  exercise: Exercise
  /** Unix timestamp of when the session was initiated. */
  sessionStartTime: number
  /** Minimal store interface for state management and UI synchronization. */
  store: {
    /** Retrieves the current domain and UI observation state. */
    getState: () => { practiceState: PracticeState | null; liveObservations?: Observation[] }
    /**
     * Updates the store state using functional updaters.
     *
     * @param partial - Partial state or updater function.
     * @param replace - Whether to replace the entire state.
     */
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
  /** Analytics handlers for recording performance metrics. */
  analytics: {
    /** Ends the analytics session and finalizes data. */
    endSession: () => void
    /** Records an individual pitch detection attempt. */
    recordNoteAttempt: (index: number, pitch: string, cents: number, inTune: boolean) => void
    /** Records the successful completion/matching of a note. */
    recordNoteCompletion: (index: number, time: number, technique?: NoteTechnique) => void
  }
  /** Optional callback to update real-time pitch feedback (e.g., for a visual tuner). */
  updatePitch?: (pitch: number, confidence: number) => void
}

/**
 * Implementation of {@link PracticeSessionRunner} that orchestrates the Practice Engine
 * and synchronizes with the application stores.
 *
 * @remarks
 * This class acts as the "glue" between the pure domain logic of the `PracticeEngine`
 * and the external world.
 *
 * **Core Responsibilities**:
 * 1. **Loop Orchestration**: Consumes engine events using an async iterator derived from the audio hardware.
 * 2. **State Synchronization**: Maps domain-level events to store updates via `handlePracticeEvent`.
 * 3. **Side Effects**: Triggers analytics recording, telemetry logging, and pitch feedback updates.
 * 4. **Lifecycle Management**: Handles graceful cancellation via {@link AbortController} and ensures no stale events are processed.
 *
 * **Performance**: The loop runs at the frequency of the `audioLoop` (typically 60Hz).
 * Internal processing is optimized to avoid allocations in the hot path.
 *
 * @public
 */
export class PracticeSessionRunnerImpl implements PracticeSessionRunner {
  private controller: AbortController | null = null
  private loopState = { lastDispatchedNoteIndex: -1, currentNoteStartedAt: Date.now() }

  /**
   * Creates an instance of PracticeSessionRunnerImpl.
   *
   * @param deps - The dependencies required for session orchestration.
   */
  constructor(private deps: SessionRunnerDependencies) {}

  /**
   * Executes the session loop until completion, error, or external cancellation.
   *
   * @remarks
   * **Lifecycle**:
   * This method is reentrant-safe; calling it while already running will cancel
   * the previous execution before starting the new one. It coordinates the
   * transition from 'ready' to 'active' states.
   *
   * **Error Handling**:
   * It catches `AbortError` to provide a clean result. Any other unexpected
   * errors are logged and returned as an `error` reason.
   *
   * @param signal - External {@link AbortSignal} (typically from a React effect or UI button).
   * @returns The session outcome {@link SessionResult}.
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
   * Immediately cancels the current execution and triggers internal cleanup.
   */
  cancel(): void {
    this.controller?.abort()
    this.controller = null
  }

  /**
   * Performs internal cleanup of session-specific resources.
   *
   * @remarks
   * Currently a no-op, but reserved for future resource management (e.g., closing workers).
   * @internal
   */
  private cleanup(): void {
    // No-op cleanup in current implementation
  }

  /**
   * Internal async loop that consumes event streams from the Practice Engine.
   *
   * @remarks
   * **Pipeline Orchestration**:
   * Connects the {@link AudioLoopPort} to the `PracticeEngine`. The `engineEvents`
   * generator yields high-level musical events (e.g., `NOTE_DETECTED`) at the
   * hardware sampling rate.
   *
   * **Iteration**:
   * The loop uses a `for await...of` pattern. It is the core "pulse" of the
   * practice session.
   *
   * @param signal - Abort signal specifically for this internal loop execution.
   * @internal
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

      // Adapt PracticeEngineEvent back to PracticeEvent for compatibility with legacy sinks
      const practiceEvent: PracticeEvent = this.mapEngineEventToPracticeEvent(event)
      this.processEvent(practiceEvent, signal)
    }
  }

  /**
   * Maps formalized engine events to legacy domain events.
   *
   * @remarks
   * This translation layer ensures that the new engine remains compatible with
   * existing event consumers without requiring a full refactor of the event sink.
   *
   * @param event - The event emitted by the practice engine.
   * @returns A compatible {@link PracticeEvent}.
   * @internal
   */
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
   * @remarks
   * This method coordinates:
   * 1. **Visual Feedback**: Updates the tuner/pitch feedback callbacks.
   * 2. **Telemetry**: Logs accuracy data for offline analysis.
   * 3. **Persistence**: Triggers analytics recording via matched note side effects.
   * 4. **State Transition**: Delegates store updates to `handlePracticeEvent`.
   *
   * @param event - The event to process.
   * @param signal - Current session signal to prevent processing after abort.
   * @internal
   */
  private processEvent(event: PracticeEvent, signal: AbortSignal): void {
    if (!event || !event.type) return

    const currentState = this.deps.store.getState().practiceState
    if (!currentState) return

    try {
      if (event.type === 'NOTE_DETECTED') {
        this.deps.updatePitch?.(event.payload.pitchHz, event.payload.confidence)

        // Accuracy Telemetry
        console.log('[TELEMETRY] Pitch Accuracy:', {
          pitch: event.payload.pitch,
          cents: event.payload.cents,
          confidence: event.payload.confidence,
          timestamp: event.payload.timestamp,
        })
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
   * @remarks
   * **Side Effects**:
   * 1. **Timing**: Calculates `timeToComplete` by measuring the delta from the
   *    previous note's completion.
   * 2. **Telemetry**: Records the attempt and completion in the analytics store.
   * 3. **State Tracking**: Updates `lastDispatchedNoteIndex` to ensure each note
   *    is only finalized once, even if the engine emits multiple `NOTE_MATCHED`
   *    events due to signal jitter.
   *
   * @param event - The NOTE_MATCHED event.
   * @param currentState - Current practice domain state.
   * @internal
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
 * @remarks
 * This is a convenience wrapper for one-off sessions. For better lifecycle
 * management in React components, prefer using the `PracticeSessionRunnerImpl`
 * class directly.
 *
 * @deprecated Use `PracticeSessionRunnerImpl` directly for better lifecycle management.
 *
 * @param deps - Session dependencies.
 * @returns A promise with the session result.
 * @public
 */
export async function runPracticeSession(deps: SessionRunnerDependencies) {
  const runner = new PracticeSessionRunnerImpl(deps)
  return runner.run(new AbortController().signal)
}
