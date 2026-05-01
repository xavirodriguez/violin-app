import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePracticeStore } from '@/stores/practice-store'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import type { PracticeSessionRunner } from '@/lib/practice/session-runner'

// Mock dependencies
vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    cleanup: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn(),
  },
}))

vi.mock('@/lib/adapters/web-audio.adapter', () => ({
  PitchDetectorAdapter: vi.fn(),
  WebAudioFrameAdapter: vi.fn(),
  WebAudioLoopAdapter: vi.fn(),
}))

const mockExercise = {
  id: 'test',
  name: 'Test',
  difficulty: 'Beginner',
  musicXML: '',
  notes: [{ pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 }],
}

describe('TASK-14 · stop() -> abort -> cleanup chain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePracticeStore.setState({
      state: { status: 'idle', exercise: undefined, error: undefined },
      practiceState: undefined,
      sessionToken: undefined,
    })
  })

  it('should trigger abort, cancel and cleanup when stop() is called in active state', async () => {
    const mockAbortController = {
      abort: vi.fn(),
    } as unknown as AbortController

    const mockRunner = {
      cancel: vi.fn(),
      run: vi.fn().mockResolvedValue({ completed: false, reason: 'cancelled' }),
    } as unknown as PracticeSessionRunner

    // Manually set state to active to simulate a running session
    // @ts-expect-error - testing with partial and mock state
    usePracticeStore.setState({
      state: {
        status: 'active',
        exercise: mockExercise,
        audioLoop: {},
        detector: {},
        runner: mockRunner,
        abortController: mockAbortController,
        practiceState: {},
        error: undefined,
      },
    })

    await usePracticeStore.getState().stop()

    // 1. Verify abortController.abort() was called
    expect(mockAbortController.abort).toHaveBeenCalled()

    // 2. Verify runner.cancel() was called
    expect(mockRunner.cancel).toHaveBeenCalled()

    // 3. Verify audioManager.cleanup() was called
    expect(audioManager.cleanup).toHaveBeenCalled()

    // 4. Verify store state transitioned to idle
    expect(usePracticeStore.getState().state.status).toBe('idle')
  })

  it('should call cleanup even if state is not active', async () => {
    // @ts-expect-error - testing with partial and mock state
    usePracticeStore.setState({
      state: {
        status: 'ready',
        exercise: mockExercise,
        audioLoop: {},
        detector: {},
        error: undefined,
      },
    })

    await usePracticeStore.getState().stop()

    expect(audioManager.cleanup).toHaveBeenCalled()
    expect(usePracticeStore.getState().state.status).toBe('idle')
  })
})
