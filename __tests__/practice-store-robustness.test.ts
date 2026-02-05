import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { audioManager } from '../lib/infrastructure/audio-manager'
import { PracticeSessionRunnerImpl } from '../lib/practice/session-runner'
import crypto from 'crypto'

// Polyfill crypto for node environment
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto
}
if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = () => crypto.randomBytes(16).toString('hex')
}

// Mock dependencies
vi.mock('@/lib/practice/session-runner', () => {
  return {
    PracticeSessionRunnerImpl: vi.fn().mockImplementation(function() {
      return {
        run: vi.fn().mockResolvedValue({ completed: true }),
        cancel: vi.fn(),
      }
    }),
  }
})

vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    setGain: vi.fn(),
    getAnalyser: vi.fn(),
  },
}))

vi.mock('@/lib/pitch-detector', () => ({
  PitchDetector: vi.fn().mockImplementation(function() {
    return {
      detectPitch: vi.fn(() => ({ pitchHz: 440, confidence: 0.9 })),
      calculateRMS: vi.fn(() => 0.1),
    }
  }),
}))

vi.mock('@/stores/tuner-store', () => ({
  useTunerStore: {
    getState: () => ({ deviceId: 'test-device', updatePitch: vi.fn() }),
    setState: vi.fn(),
  }
}))

vi.mock('@/stores/analytics-store', () => ({
  useAnalyticsStore: {
    getState: () => ({
      startSession: vi.fn(),
      endSession: vi.fn(),
      recordNoteAttempt: vi.fn(),
      recordNoteCompletion: vi.fn(),
    })
  }
}))

const mockExercise: any = {
  id: 'test-ex',
  name: 'Test',
  notes: [{ pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 }],
}

describe('PracticeStore Robustness', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await usePracticeStore.getState().reset()
  })

  it('should prevent double start while already starting', async () => {
    const store = usePracticeStore.getState()
    await store.loadExercise(mockExercise)

    // Mock initializeAudio to be slow
    vi.mocked(audioManager.initialize).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        context: { sampleRate: 44100 },
        analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
        stream: { getTracks: () => [] }
      } as any), 100))
    )

    const p1 = store.start()
    const p2 = store.start()

    await Promise.all([p1, p2])

    // audioManager.initialize should only be called once because of isStarting guard
    expect(audioManager.initialize).toHaveBeenCalledTimes(1)
  })

  it('should handle idempotent stop calls', async () => {
    await usePracticeStore.getState().loadExercise(mockExercise)

    // Setup for active state
    vi.mocked(audioManager.initialize).mockResolvedValue({
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
      stream: { getTracks: () => [] }
    } as any)

    await usePracticeStore.getState().start()
    expect(usePracticeStore.getState().state.status).toBe('active')

    await usePracticeStore.getState().stop()
    expect(usePracticeStore.getState().state.status).toBe('idle')
    expect(usePracticeStore.getState().sessionToken).toBeNull()

    // Second stop should not throw
    await expect(usePracticeStore.getState().stop()).resolves.toBeUndefined()
  })

  it('should allow retrying initializeAudio after a failure', async () => {
    await usePracticeStore.getState().loadExercise(mockExercise)

    // First attempt fails
    vi.mocked(audioManager.initialize).mockRejectedValueOnce(new Error('Mic denied'))
    await usePracticeStore.getState().initializeAudio()
    expect(usePracticeStore.getState().state.status).toBe('error')
    expect(usePracticeStore.getState().error).not.toBeNull()

    // Second attempt succeeds
    vi.mocked(audioManager.initialize).mockResolvedValueOnce({
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
      stream: { getTracks: () => [] }
    } as any)

    await usePracticeStore.getState().initializeAudio()
    expect(usePracticeStore.getState().state.status).toBe('ready')
    expect(usePracticeStore.getState().error).toBeNull()
  })

  it('should ignore updates from old session tokens', async () => {
    await usePracticeStore.getState().loadExercise(mockExercise)

    vi.mocked(audioManager.initialize).mockResolvedValue({
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
      stream: { getTracks: () => [] }
    } as any)

    await usePracticeStore.getState().start()
    const firstToken = usePracticeStore.getState().sessionToken
    expect(firstToken).not.toBeNull()

    // Get a reference to safeSet (it's passed to runner)
    const runnerArgs = vi.mocked(PracticeSessionRunnerImpl).mock.calls[0][0]
    const safeSet = runnerArgs.store.setState

    // Stop and start new session
    await usePracticeStore.getState().stop()
    await usePracticeStore.getState().start()
    const secondToken = usePracticeStore.getState().sessionToken
    expect(secondToken).not.toEqual(firstToken)

    // Attempt to update using the old safeSet
    const oldPracticeState = { ...usePracticeStore.getState().practiceState, holdDuration: 999 } as any
    safeSet({ practiceState: oldPracticeState })

    // Should NOT have updated because sessionToken in store is now different
    expect(usePracticeStore.getState().practiceState?.holdDuration).not.toBe(999)
  })
})
