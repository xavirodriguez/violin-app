import { type PracticeState, reducePracticeEvent, type PracticeEvent } from '@/lib/practice-core'

/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 */
type StoreApi<T> = {
  getState: () => T
  setState: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: false,
  ) => void
}

/**
 * Handles all state transitions and side effects for a given practice event.
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

  // 2. Side effects (executed outside of the reducer/updater)
  if (shouldTriggerCompletion) {
    try {
      analytics?.endSession()
      onCompleted()
    } catch (error) {
      console.error('[EVENT SINK] Failed to handle practice completion side effect:', error)
    }
  }
}
