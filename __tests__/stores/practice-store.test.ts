import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePracticeStore } from '@/stores/practice-store'

// Mock audioManager
vi.mock('@/lib/infrastructure/audio-manager', () => {
  const mockAnalyser = { fftSize: 2048 }
  return {
    audioManager: {
      initialize: vi.fn().mockResolvedValue({
        context: { sampleRate: 44100 },
        analyser: mockAnalyser
      }),
      cleanup: vi.fn().mockResolvedValue(undefined),
      getAnalyser: vi.fn().mockReturnValue(mockAnalyser),
      setGain: vi.fn()
    }
  }
})

// Mock PitchDetector
vi.mock('@/lib/pitch-detector', () => {
  return {
    PitchDetector: vi.fn().mockImplementation(function() {
      return {
        detectPitch: vi.fn(),
        calculateRMS: vi.fn(),
      }
    })
  }
})

// Mock tuner store
vi.mock('@/stores/tuner-store', () => ({
  useTunerStore: {
    getState: vi.fn(() => ({ deviceId: null, sensitivity: 50 }))
  }
}))

const mockExercise = {
  id: 'test-ex',
  name: 'Test Exercise',
  notes: [
    { pitch: { step: 'A', octave: 4, alter: 0 }, duration: 'q' }
  ]
}

describe('PracticeStore', () => {
  beforeEach(() => {
    usePracticeStore.getState().reset()
    vi.clearAllMocks()
  })

  it('should initialize with null state', () => {
    expect(usePracticeStore.getState().practiceState).toBeNull()
  })

  it('should load exercise and set status to idle', () => {
    usePracticeStore.getState().loadExercise(mockExercise as any)
    const state = usePracticeStore.getState()
    expect(state.practiceState?.status).toBe('idle')
  })

  it('should transition to listening on start()', async () => {
    usePracticeStore.getState().loadExercise(mockExercise as any)
    await usePracticeStore.getState().start()
    const state = usePracticeStore.getState()

    expect(state.practiceState?.status).toBe('listening')
    expect(state.analyser).not.toBeNull()
    expect(state.detector).not.toBeNull()
  })

  it('should process NOTE_DETECTED in consumePipelineEvents', async () => {
    usePracticeStore.getState().loadExercise(mockExercise as any)
    await usePracticeStore.getState().start()

    const mockDetection = {
      pitch: 'A4',
      pitchHz: 440,
      cents: 0,
      confidence: 0.9,
      timestamp: Date.now()
    }

    const pipeline = async function* () {
      yield { type: 'NOTE_DETECTED', payload: mockDetection }
    }()

    await usePracticeStore.getState().consumePipelineEvents(pipeline as any)
    const state = usePracticeStore.getState()
    expect(state.practiceState?.status).toBe('listening')
    expect(state.practiceState?.detectionHistory.length).toBe(1)
  })

  it('should update liveObservations in real time', async () => {
    usePracticeStore.getState().loadExercise(mockExercise as any)
    await usePracticeStore.getState().start()

    const sharpDetections = Array(10).fill(null).map((_, i) => ({
      type: 'NOTE_DETECTED' as const,
      payload: {
        pitch: 'A4',
        pitchHz: 440,
        cents: 20,
        confidence: 0.9,
        timestamp: Date.now() + i * 50
      }
    }))

    const pipeline = async function* () {
      for (const event of sharpDetections) {
        yield event
      }
    }()

    await usePracticeStore.getState().consumePipelineEvents(pipeline as any)
    const state = usePracticeStore.getState()
    expect(state.liveObservations.length).toBeGreaterThan(0)
    expect(state.liveObservations[0].message).toContain('sharp')
  })

  it('should clear liveObservations on NOTE_MATCHED', async () => {
    usePracticeStore.getState().loadExercise(mockExercise as any)
    await usePracticeStore.getState().start()

    usePracticeStore.setState({ liveObservations: [{ type: 'intonation', severity: 1, confidence: 1, message: 'test', tip: 'test' } as any] })

    const pipeline = async function* () {
      yield { type: 'NOTE_MATCHED' }
    }()

    await usePracticeStore.getState().consumePipelineEvents(pipeline as any)
    const state = usePracticeStore.getState()
    expect(state.liveObservations).toEqual([])
  })
})
