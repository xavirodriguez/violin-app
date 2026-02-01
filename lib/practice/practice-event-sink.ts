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
    console.warn('[INVALID EVENT]', event)
    return
  }

  const currentState = store.getState().practiceState
  if (!currentState) {
    console.error('[STATE NULL]', { event })
    return
  }

  // 1. Pure state transition
  store.setState((state) => {
    if (!state || !state.practiceState) {
      console.warn('[EVENT SINK] Cannot reduce event: State or practiceState is null')
      return state
    }

    const nextState = reducePracticeEvent(state.practiceState, event)

    if (!nextState) {
      console.error('[EVENT SINK] Reducer returned null state', { event })
      return state
    }

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
