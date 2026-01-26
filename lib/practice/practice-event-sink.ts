import {
  type PracticeState,
  reducePracticeEvent,
  type PracticeEvent,
} from '@/lib/practice-core'
import { useAnalyticsStore } from '@/lib/stores/analytics-store'

/**
 * A type representing the core state management functions of a Zustand store.
 *
 * @template T - The type of the state managed by the store.
 */
type StoreApi<T> = {
  getState: () => T
  setState: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
  ) => void
}

/**
 * Handles all state transitions and side effects for a given practice event.
 *
 * @remarks
 * This function acts as a centralized sink for all events originating from the
 * practice pipeline. It orchestrates the process of:
 * 1.  Reducing the current state based on the event to get the new, pure state.
 * 2.  Committing the new state to the Zustand store.
 * 3.  Triggering any necessary side effects (e.g., analytics) in a safe manner.
 *
 * This decouples the core practice loop from the application's side effect concerns,
 * making the system more modular and easier to test. It also provides a single
 * point for error handling and logging related to event processing.
 *
 * @param event - The `PracticeEvent` to be processed.
 * @param store - The Zustand store API (`{ getState, setState }`) for the practice store.
 * @param onCompleted - A callback to be invoked when the exercise is completed.
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
    if (event.type === 'NOTE_MATCHED') {
      const target = currentState.exercise.notes[currentState.currentIndex]
      // This check prevents duplicate analytics events for the same note.
      if (newState.currentIndex !== currentState.currentIndex) {
        useAnalyticsStore
          .getState()
          .recordNoteAttempt(currentState.currentIndex, target.pitch, 0, true)
      }
    }

    if (
      newState.status === 'completed' &&
      currentState.status !== 'completed'
    ) {
      useAnalyticsStore.getState().endSession()
      onCompleted()
    }
  } catch (error) {
    // In a real app, you'd use a proper logger here.
    console.error('Failed to handle practice event side effect:', error)
  }
}
