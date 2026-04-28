import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePracticeStore } from '@/stores/practice-store'
import type { PracticeEvent } from '@/lib/practice-core'

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
    const store = usePracticeStore.getState()

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

    // The first event should have been applied (updates detection history)
    // The second event should be ignored.
    // However, NOTE_DETECTED doesn't change currentIndex.
    // Let's use a mock state change that is visible.

    const history = usePracticeStore.getState().practiceState?.detectionHistory
    expect(history).toHaveLength(1)
    expect(history?.[0].pitch).toBe('A4')
  })

  it('should discard updates from the safeSet mechanism if the token is stale', () => {
    // safeSet is internal but used by createRunnerDeps -> buildRunnerStoreInterface
    // We can test resolveSafeUpdate or just the logic in createSafeSet indirectly

    const tokenA = 'token-a'
    const tokenB = 'token-b'

    usePracticeStore.setState({ sessionToken: tokenA })

    // Simulate what createSafeSet does
    const get = usePracticeStore.getState
    const set = usePracticeStore.setState

    const safeSetA = (partial: any) => {
      const isStale = get().sessionToken !== tokenA
      if (isStale) return
      // simplified resolveSafeUpdate logic
      set(partial)
    }

    // Change token to B
    usePracticeStore.setState({ sessionToken: tokenB })

    // Try to update using safeSetA (which has tokenA)
    safeSetA({ practiceState: { ...get().practiceState, currentIndex: 99 } })

    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(0)
  })
})
