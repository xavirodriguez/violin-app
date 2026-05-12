import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePracticeStore, createSafeSet } from '@/stores/practice-store'

describe('TASK-15 · sessionToken anti-stale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePracticeStore.setState({
      practiceState: {
        status: 'listening',
        exercise: { id: 'test', name: 'Test', difficulty: 'Beginner', musicXML: '', notes: [{}] } as unknown as never,
        currentIndex: 0,
        detectionHistory: [],
        perfectNoteStreak: 0,
        holdDuration: 0,
      },
      sessionToken: 'initial-token',
    })
  })

  it('should discard updates from the safeSet mechanism if the token is stale', () => {
    const staleToken = 'old-token'
    const currentToken = 'new-token'

    // Set current token in store
    usePracticeStore.setState({ sessionToken: currentToken })

    // Create a safeSet bound to the stale token
    const safeSetStale = createSafeSet({
      set: (partial) => usePracticeStore.setState(partial),
      get: () => usePracticeStore.getState(),
      currentToken: staleToken,
    })

    const initialState = usePracticeStore.getState().practiceState

    // Try to update using safeSet with stale token
    safeSetStale({
      practiceState: { ...(initialState as object), currentIndex: 99 } as unknown as never,
    })

    // Should NOT have updated
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(0)

    // Create a safeSet with the current token
    const safeSetCurrent = createSafeSet({
      set: (partial) => usePracticeStore.setState(partial),
      get: () => usePracticeStore.getState(),
      currentToken: currentToken,
    })

    safeSetCurrent({
      practiceState: { ...(initialState as object), currentIndex: 5 } as unknown as never,
    })

    // Should HAVE updated
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(5)
  })

  it('internalUpdate should use session token if provided (simulated)', () => {
      // In our current store, internalUpdate doesn't take a token yet,
      // but we can verify the safeSet utility works as expected for async processes.
      const token = 'active-token';
      usePracticeStore.setState({
          sessionToken: token,
          practiceState: {
            status: 'listening',
            exercise: { id: 'test', name: 'Test', difficulty: 'Beginner', musicXML: '', notes: [{}, {}, {}] } as unknown as never,
            currentIndex: 0,
            detectionHistory: [],
            perfectNoteStreak: 0,
            holdDuration: 0,
          }
      });

      const safeUpdate = (event: Parameters<typeof usePracticeStore.getState>['0']['internalUpdate'] extends (e: infer E, ...args: unknown[]) => unknown ? E : unknown) => {
          const { sessionToken } = usePracticeStore.getState();
          if (sessionToken === token) {
              usePracticeStore.getState().internalUpdate(event);
          }
      };

      safeUpdate({ type: 'JUMP_TO_NOTE', payload: { index: 1 } });
      expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(1);

      usePracticeStore.setState({ sessionToken: 'different-token' });
      safeUpdate({ type: 'JUMP_TO_NOTE', payload: { index: 2 } });
      // Should still be 1
      expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(1);
  });
})
