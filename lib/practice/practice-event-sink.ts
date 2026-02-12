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
   * @returns The current state object of type `T`.
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
 * Handles state transitions and side effects for practice events emitted by the audio pipeline.
 *
 * @remarks
 * This function acts as the "event sink" that bridges the gap between the asynchronous,
 * high-frequency audio pipeline and the reactive Zustand stores.
 *
 * **Core Responsibilities**:
 * 1. **Atomic State Transitions**: Updates `practiceState` using the `reducePracticeEvent` reducer within a `store.setState` call.
 * 2. **Side Effect Orchestration**: Detects transitions (e.g., to 'completed') and triggers external callbacks like analytics finalization.
 * 3. **Defensive Programming**: Validates incoming events and current state to prevent runtime crashes during audio processing.
 *
 * **Concurrency**: This function is designed to be called frequently (up to 60 times per second).
 * It relies on functional state updates to ensure consistency even if events arrive in rapid succession.
 *
 * @param event - The practice event (e.g., NOTE_DETECTED, NOTE_MATCHED) to process.
 * @param store - The Zustand store API instance where the state resides.
 * @param onCompleted - Callback triggered when the state transitions from any state to 'completed'.
 * @param analytics - Optional handlers for telemetry and session data recording.
 *
 * @example
 * ```ts
 * handlePracticeEvent(event, usePracticeStore, () => showConfetti(), {
 *   endSession: () => analytics.track('session_end')
 * });
 * ```
 *
 * @public
 */
export const handlePracticeEvent = <T extends { practiceState: PracticeState | null }>(
  event: PracticeEvent,
  store: StoreApi<T>,
  onCompleted: () => void,
  analytics?: { endSession: () => void },
) => {
  if (!event || !event.type) {
    console.warn('[EVENT SINK] [INVALID EVENT]', event)
    return
  }

  const currentState = store.getState().practiceState
  if (!currentState) {
    console.error('[EVENT SINK] [STATE NULL] No practiceState in store', { type: event.type })
    return
  }

  // 1. Pure state transition and side effect detection
  let shouldTriggerCompletion = false

  store.setState((state) => {
    if (!state || !state.practiceState) {
      console.warn('[EVENT SINK] Cannot reduce event: State or practiceState is null', {
        type: event.type,
      })
      return state
    }

    const currentState = state.practiceState
    const nextState = reducePracticeEvent(currentState, event)

    if (!nextState) {
      console.error('[EVENT SINK] Reducer returned null state', { event })
      return state
    }

    // Detect transition to completed: Only trigger if we weren't already completed
    if (nextState.status === 'completed' && currentState.status !== 'completed') {
      shouldTriggerCompletion = true
    }

    return { ...state, practiceState: nextState }
  })

  // 2. Side effects (executed outside of the reducer/updater to ensure consistency and avoid store locking)
  if (shouldTriggerCompletion) {
    try {
      analytics?.endSession()
      onCompleted()
    } catch (error) {
      console.error('[EVENT SINK] Failed to handle practice completion side effect:', error)
    }
  }
}
