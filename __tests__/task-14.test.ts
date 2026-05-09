import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePracticeStore } from '@/stores/practice-store'
import { audioManager } from '@/lib/infrastructure/audio-manager'

// Mock dependencies
vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    cleanup: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn(),
  },
}))

vi.mock('@/lib/practice/practice-service', () => ({
  practiceService: {
    stop: vi.fn(),
  },
}))

const mockExercise = {
  id: 'test',
  name: 'Test',
  difficulty: 'Beginner',
  musicXML: '',
  notes: [{ pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 }],
}

describe('TASK-14 · stop() -> cleanup chain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePracticeStore.getState().reset()
  })

  it('should trigger service stop and audio cleanup when stop() is called', async () => {
    const { practiceService } = await import('@/lib/practice/practice-service')

    // Manually set state to active to simulate a running session
    usePracticeStore.setState({
      status: 'active',
      exercise: mockExercise as any,
    })

    await usePracticeStore.getState().stop()

    // 1. Verify practiceService.stop() was called
    expect(practiceService.stop).toHaveBeenCalled()

    // 2. Verify audioManager.cleanup() was called
    expect(audioManager.cleanup).toHaveBeenCalled()

    // 3. Verify store state transitioned to ready
    expect(usePracticeStore.getState().status).toBe('ready')
  })

  it('should call cleanup even if state is not active', async () => {
    usePracticeStore.setState({
      status: 'ready',
      exercise: mockExercise as any,
    })

    await usePracticeStore.getState().stop()

    expect(audioManager.cleanup).toHaveBeenCalled()
    expect(usePracticeStore.getState().status).toBe('ready')
  })
})
