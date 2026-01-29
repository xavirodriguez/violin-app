import { type PracticeState, reducePracticeEvent, type PracticeEvent } from '@/lib/practice-core'

/**
 * A type representing the core state management functions of a Zustand store,
 * generic over the state type `T`.
 */
type StoreApi<T> = {
  getState: () => T
  setState: (fn: (state: T) => T | Partial<T>) => void
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
  if (!event) {
    console.warn('[EVENT SINK] Received null event')
    return
  }

  const currentState = store.getState().practiceState
  if (!currentState) {
    console.error('[EVENT SINK] State is null during event processing', event)
    return
  }

  // 1. Pure state transition
  store.setState((state) => {
    if (!state.practiceState) return state
    const nextState = reducePracticeEvent(state.practiceState, event)

    // 2. Side effects (triggered by state change)
    if (nextState.status === 'completed' && state.practiceState.status !== 'completed') {
      setTimeout(() => {
        try {
          analytics?.endSession()
          onCompleted()
        } catch (error) {
          console.error('Failed to handle practice completion side effect:', error)
        }
      }, 0)
    }

    return { ...state, practiceState: nextState }
  })
}
