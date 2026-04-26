import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { audioManager } from '../lib/infrastructure/audio-manager'
import { PracticeSessionRunnerImpl } from '../lib/practice/session-runner'
import crypto from 'crypto'
import type {
  MockExercise,
  MockAudioResources,
  GlobalThisWithCrypto,
} from '@/lib/testing/mock-types'
import { Exercise } from '@/lib/exercises/types'
import { PracticeState } from '@/lib/practice-core'

// Polyfill crypto for node environment
const typedGlobal = globalThis as typeof globalThis & GlobalThisWithCrypto
if (!typedGlobal.crypto) {
  typedGlobal.crypto = crypto as Crypto
}
if (!typedGlobal.crypto.randomUUID) {
  typedGlobal.crypto.randomUUID = () => crypto.randomBytes(16).toString('hex')
}

// Mock dependencies
vi.mock('@/lib/practice/session-runner', () => {
  return {
    PracticeSessionRunnerImpl: vi.fn().mockImplementation(function () {
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

vi.mock('@/lib/pitch-detector', () => {
  const mockDetector = {
    detectPitch: vi.fn(() => ({ pitchHz: 440, confidence: 0.9 })),
    calculateRMS: vi.fn(() => 0.1),
    setMaxFrequency: vi.fn(),
  }
  return {
    PitchDetector: vi.fn().mockImplementation(() => mockDetector),
    createPitchDetectorForDifficulty: vi.fn().mockImplementation(() => mockDetector),
  }
})

vi.mock('@/stores/tuner-store', () => ({
  useTunerStore: {
    getState: () => ({ deviceId: 'test-device', updatePitch: vi.fn() }),
    setState: vi.fn(),
  },
}))

vi.mock('@/stores/analytics-store', () => ({
  useAnalyticsStore: {
    getState: () => ({
      startSession: vi.fn(),
      endSession: vi.fn(),
      recordNoteAttempt: vi.fn(),
      recordNoteCompletion: vi.fn(),
    }),
  },
}))

const mockExercise: MockExercise = {
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
    await store.loadExercise(mockExercise as Exercise)

    // Mock initializeAudio to be slow
    vi.mocked(audioManager.initialize).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            const resources: MockAudioResources = {
              context: { sampleRate: 44100 },
              analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
              stream: { getTracks: () => [] },
            }
            resolve(resources as unknown as MockAudioResources)
          }, 100),
        ),
    )

    const p1 = store.start()
    const p2 = store.start()

    await Promise.all([p1, p2])

    // audioManager.initialize should only be called once because of isStarting guard
    expect(audioManager.initialize).toHaveBeenCalledTimes(1)
  })

  it('should handle idempotent stop calls', async () => {
    await usePracticeStore.getState().loadExercise(mockExercise as Exercise)

    // Setup for active state
    const resources: MockAudioResources = {
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
      stream: { getTracks: () => [] },
    }
    vi.mocked(audioManager.initialize).mockResolvedValue(resources as unknown as MockAudioResources)

    await usePracticeStore.getState().start()
    expect(usePracticeStore.getState().state.status).toBe('active')

    await usePracticeStore.getState().stop()
    expect(usePracticeStore.getState().state.status).toBe('idle')
    expect(usePracticeStore.getState().sessionToken).toBeUndefined()

    // Second stop should not throw
    await expect(usePracticeStore.getState().stop()).resolves.toBeUndefined()
  })

  it('should allow retrying initializeAudio after a failure', async () => {
    await usePracticeStore.getState().loadExercise(mockExercise as Exercise)

    // First attempt fails
    vi.mocked(audioManager.initialize).mockRejectedValueOnce(new Error('Mic denied'))
    await usePracticeStore.getState().initializeAudio()
    expect(usePracticeStore.getState().state.status).toBe('error')
    expect(usePracticeStore.getState().error).not.toBeUndefined()

    // Second attempt succeeds
    const successResources: MockAudioResources = {
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
      stream: { getTracks: () => [] },
    }
    vi.mocked(audioManager.initialize).mockResolvedValueOnce(
      successResources as unknown as MockAudioResources,
    )

    await usePracticeStore.getState().initializeAudio()
    expect(usePracticeStore.getState().state.status).toBe('ready')
    expect(usePracticeStore.getState().error).toBeUndefined()
  })

  it('should ignore updates from old session tokens', async () => {
    await usePracticeStore.getState().loadExercise(mockExercise as Exercise)

    const sessionResources: MockAudioResources = {
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048, context: { sampleRate: 44100 } },
      stream: { getTracks: () => [] },
    }
    vi.mocked(audioManager.initialize).mockResolvedValue(
      sessionResources as unknown as MockAudioResources,
    )

    await usePracticeStore.getState().start()
    const firstToken = usePracticeStore.getState().sessionToken
    expect(firstToken).not.toBeUndefined()

    // Get a reference to safeSet (it's passed to runner)
    const runnerArgs = vi.mocked(PracticeSessionRunnerImpl).mock.calls[0][0]
    const safeSet = runnerArgs.store.setState

    // Stop and start new session
    await usePracticeStore.getState().stop()
    await usePracticeStore.getState().start()
    const secondToken = usePracticeStore.getState().sessionToken
    expect(secondToken).not.toEqual(firstToken)

    // Attempt to update using the old safeSet
    const oldPracticeState = {
      ...usePracticeStore.getState().practiceState,
      holdDuration: 999,
    }
    safeSet({ practiceState: oldPracticeState as PracticeState })

    // Should NOT have updated because sessionToken in store is now different
    expect(usePracticeStore.getState().practiceState?.holdDuration).not.toBe(999)
  })
})
