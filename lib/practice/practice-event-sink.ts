import { type PracticeState, reducePracticeEvent, type PracticeEvent } from '@/lib/practice-core'

/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 *
 * @remarks
 * This interface is a subset of the standard Zustand `StoreApi`, used here
 * to decouple the event sink from specific store implementations.
 *
 * @public
 */
type StoreApi<T> = {
  /**
   * Retrieves the current state from the store.
   *
   * @returns The current state object.
   */
  getState: () => T

  /**
   * Updates the store state using a partial update or an updater function.
   *
   * @remarks
   * When using an updater function, Zustand ensures that the state is updated
   * atomically within its own reactive lifecycle.
   *
   * @param partial - The new state values or a function that receives the current state and returns updates.
   * @param replace - If true, replaces the entire state instead of merging. Defaults to false.
   */
  setState: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
  ) => void
}

/**
 * Parameters for the practice event handler.
 * @public
 */
export interface HandlePracticeEventParams<T> {
  /** The practice event to process. */
  event: PracticeEvent
  /** The Zustand store API instance where the state resides. */
  store: StoreApi<T>
  /** Callback triggered when the state transitions to 'completed'. */
  onCompleted: () => void
  /** Optional handlers for telemetry and session data recording. */
  analytics?: { endSession: () => void }
}

/**
 * Handles state transitions and side effects for practice events emitted by the audio pipeline.
 *
 * @remarks
 * This function acts as the "event sink" that bridges the gap between the asynchronous,
 * high-frequency audio pipeline and the reactive Zustand stores.
 *
 * @param params - Configuration parameters for the handler.
 *
 * @example
 * ```ts
 * handlePracticeEvent({
 *   event,
 *   store: usePracticeStore,
 *   onCompleted: () => showConfetti(),
 *   analytics: { endSession: () => analytics.track('session_end') }
 * });
 * ```
 *
 * @public
 */
export const handlePracticeEvent = <T extends { practiceState: PracticeState | undefined }>(
  params: HandlePracticeEventParams<T>,
) => {
  const { event, store, onCompleted, analytics } = params
  if (!event?.type) return

  const practiceState = store.getState().practiceState
  if (!practiceState) return

  let shouldTriggerCompletion = false

  store.setState((state) => {
    if (!state.practiceState) return state
    const nextState = reducePracticeEvent(state.practiceState, event)

    if (nextState.status === 'completed' && state.practiceState.status !== 'completed') {
      shouldTriggerCompletion = true
    }
    return { ...state, practiceState: nextState }
  })

  if (shouldTriggerCompletion) {
    executeCompletionSideEffects(onCompleted, analytics)
  }
}

function executeCompletionSideEffects(onCompleted: () => void, analytics?: { endSession: () => void }) {
  try {
    analytics?.endSession()
    onCompleted()
  } catch (error) {
    console.error('[EVENT SINK] Failed completion side effects:', error)
  }
}
