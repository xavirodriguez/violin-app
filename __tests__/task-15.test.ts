import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePracticeStore, createSafeSet } from '@/stores/practice-store'
import type { PracticeEvent } from '@/lib/domain/practice'

describe('TASK-15 · sessionToken anti-stale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePracticeStore.setState({
      practiceState: {
        status: 'listening',
        exercise: { id: 'test', name: 'Test', difficulty: 'Beginner', musicXML: '', notes: [] },
        currentIndex: 0,
        detectionHistory: [],
        perfectNoteStreak: 0,
      },
      sessionToken: 'initial-token',
    })
  })

  it('should discard updates from consumePipelineEvents if the session token changes', async () => {
    // Create an async generator that yields events
    async function* eventGenerator() {
      // First event is fine
      yield { type: 'NOTE_DETECTED', payload: { pitch: 'A4', pitchHz: 440, cents: 0, timestamp: Date.now(), confidence: 1 } } as PracticeEvent

      // Now change the token in the store
      usePracticeStore.setState({ sessionToken: 'new-token' })

      // This event should be ignored because the token was captured at start of consumePipelineEvents
      yield { type: 'NOTE_DETECTED', payload: { pitch: 'B4', pitchHz: 493.88, cents: 0, timestamp: Date.now(), confidence: 1 } } as PracticeEvent
    }

    // Capture initial state
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(0)

    // Run the consumer
    await usePracticeStore.getState().consumePipelineEvents(eventGenerator())

    // The first event should have been applied
    const history = usePracticeStore.getState().practiceState?.detectionHistory
    expect(history).toHaveLength(1)
    expect(history?.[0].pitch).toBe('A4')
  })

  it('should discard updates from the actual createSafeSet mechanism if the token is stale', () => {
    const staleToken = 'old-token'
    const currentToken = 'new-token'

    // Set current token in store
    usePracticeStore.setState({ sessionToken: currentToken })

    // Create a safeSet bound to the stale token using the real exported function
    const safeSetStale = createSafeSet({
      set: usePracticeStore.setState,
      get: usePracticeStore.getState,
      currentToken: staleToken
    })

    const initialState = usePracticeStore.getState().practiceState

    // Try to update using safeSet with stale token
    // @ts-expect-error - testing with partial practice state
    safeSetStale({ practiceState: { ...initialState, currentIndex: 99 } })

    // Should NOT have updated
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(0)

    // Create a safeSet with the current token
    const safeSetCurrent = createSafeSet({
      set: usePracticeStore.setState,
      get: usePracticeStore.getState,
      currentToken: currentToken
    })

    // @ts-expect-error - testing with partial practice state
    safeSetCurrent({ practiceState: { ...initialState, currentIndex: 5 } })

    // Should HAVE updated
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(5)
  })
})
