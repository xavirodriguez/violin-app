import { type PracticeState, reducePracticeEvent, type PracticeEvent } from '@/lib/practice-core'

/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 * @internal
 */
type StoreApi<T> = {
  /** Retrieves the current state from the store. */
  getState: () => T
  /**
   * Updates the store state using a partial update or an updater function.
   *
   * @param partial - The new state or a function that returns the new state.
   * @param replace - If true, replaces the entire state instead of merging.
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
 * This function acts as the "event sink" that bridges the gap between the event-driven
 * audio pipeline and the reactive Zustand stores. It ensures that:
 * 1. **Pure State Transitions**: Performed via the `reducePracticeEvent` reducer to maintain consistency.
 * 2. **Side Effect Detection**: Detects transitions to 'completed' and triggers callbacks.
 * 3. **Error Resilience**: Implements defensive guards against null states or invalid events.
 *
 * **Architectural Role**:
 * This is a critical bridge component. It must remain pure in its state update logic
 * (relying on the reducer) while safely managing the asynchronous side effects
 * (analytics, completions) that occur when specific thresholds are met.
 *
 * @param event - The practice event to process.
 * @param store - The Zustand store API to update.
 * @param onCompleted - Callback triggered when the exercise is successfully completed.
 * @param analytics - Optional analytics handlers for session finalization.
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

    // Detect transition to completed
    if (nextState.status === 'completed' && currentState.status !== 'completed') {
      shouldTriggerCompletion = true
    }

    return { ...state, practiceState: nextState }
  })

  // 2. Side effects (executed outside of the reducer/updater to ensure consistency)
  if (shouldTriggerCompletion) {
    try {
      analytics?.endSession()
      onCompleted()
    } catch (error) {
      console.error('[EVENT SINK] Failed to handle practice completion side effect:', error)
    }
  }
}
