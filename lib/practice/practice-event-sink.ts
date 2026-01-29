import {
  type PracticeState,
  reducePracticeEvent,
  type PracticeEvent,
} from '@/lib/practice-core'
import { useAnalyticsStore } from '@/stores/analytics-store'

/**
 * A type representing the core state management functions of a Zustand store.
 */
type StoreApi<T> = {
  getState: () => T
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void
}

/**
 * Handles all state transitions and side effects for a given practice event.
 */
export const handlePracticeEvent = (
  event: PracticeEvent,
  store: StoreApi<{ practiceState: PracticeState | null }>,
  onCompleted: () => void,
) => {
  const currentState = store.getState().practiceState
  if (!currentState) return

  // 1. Pure state transition
  const newState = reducePracticeEvent(currentState, event)
  store.setState({ practiceState: newState })

  // 2. Side effects
  try {
    if (newState.status === 'completed' && currentState.status !== 'completed') {
      useAnalyticsStore.getState().endSession()
      onCompleted()
    }
  } catch (error) {
    console.error('Failed to handle practice event side effect:', error)
  }
}
