import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import type { Exercise } from '../lib/exercises/types'
import { audioManager } from '../lib/infrastructure/audio-manager'

// Mock dependencies
vi.mock('@/lib/practice/session-runner', () => ({
  runPracticeSession: vi.fn().mockImplementation(() => new Promise(() => {})),
  PracticeSessionRunnerImpl: vi.fn().mockImplementation(function() {
    return {
      run: vi.fn().mockImplementation(() => new Promise(() => {})),
      cancel: vi.fn()
    }
  })
}))

vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    setGain: vi.fn(),
    getAnalyser: vi.fn(),
  },
}))

vi.mock('@/lib/pitch-detector', () => ({
  PitchDetector: vi.fn().mockImplementation(function(this: any) {
    this.setMaxFrequency = vi.fn()
    this.detectPitch = vi.fn(() => ({ pitchHz: 0, confidence: 0 }))
    this.calculateRMS = vi.fn(() => 0)
    return this
  }),
  cleanup: vi.fn()
}))

// Mock de ejercicio
const mockExercise: Exercise = {
  id: 'test-exercise',
  name: 'Test Exercise',
  description: 'A test exercise',
  category: 'Open Strings',
  difficulty: 'Beginner',
  scoreMetadata: {
    clef: 'G',
    timeSignature: { beats: 4, beatType: 4 },
    keySignature: 0,
  },
  notes: [
    { pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 },
    { pitch: { step: 'B', octave: 4, alter: 0 }, duration: 4 },
  ],
  musicXML: '',
  technicalGoals: [],
  estimatedDuration: '1m',
  technicalTechnique: 'None',
}

describe('Practice Store Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePracticeStore.getState().reset()
  })

  it('should initialize with null practiceState', () => {
    const store = usePracticeStore.getState()
    expect(store.practiceState).toBeNull()
  })

  it('loadExercise should set initial state', async () => {
    const store = usePracticeStore.getState()
    await store.loadExercise(mockExercise)

    // 2. Start practice
    const mockContext = { sampleRate: 44100 }
    const mockAnalyser = {
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
      context: mockContext
    }
    vi.mocked(audioManager.initialize).mockResolvedValue({
      context: mockContext as any,
      analyser: mockAnalyser as any,
      stream: {} as any
    })

    await store.start()

    expect(usePracticeStore.getState().practiceState?.status).toBe('listening')
    expect(usePracticeStore.getState().analyser).not.toBeNull()
    expect(usePracticeStore.getState().detector).not.toBeNull()
    expect(audioManager.initialize).toHaveBeenCalled()
  })

  it('consumePipelineEvents should process NOTE_DETECTED and update liveObservations', async () => {
    const store = usePracticeStore.getState()
    await store.loadExercise(mockExercise)
    await store.start()

    const mockDetection = {
      pitch: 'A4',
      pitchHz: 440,
      cents: 20,
      confidence: 0.9,
      timestamp: Date.now(),
    }

    const mockPipeline = async function* () {
      yield { type: 'NOTE_DETECTED' as const, payload: mockDetection }
    }()

    await store.consumePipelineEvents(mockPipeline)

    const state = usePracticeStore.getState().practiceState
    expect(state?.detectionHistory.length).toBe(1)
    expect(state?.detectionHistory[0].pitch).toBe('A4')
  })

  it('liveObservations should update in real-time with consistent sharp detections', async () => {
    const store = usePracticeStore.getState()
    await store.loadExercise(mockExercise)
    await store.start()

    const mockPipeline = async function* () {
      for (let i = 0; i < 10; i++) {
        yield {
          type: 'NOTE_DETECTED' as const,
          payload: {
            pitch: 'A4',
            pitchHz: 440,
            cents: 20, // Consistentemente sharp (>15)
            confidence: 0.9,
            timestamp: Date.now() + i * 50
          }
        }
      }
    }()

    await store.consumePipelineEvents(mockPipeline)

    const observations = usePracticeStore.getState().liveObservations
    expect(observations.length).toBeGreaterThan(0)
    expect(observations[0].type).toBe('intonation')
    expect(observations[0].message).toContain('sharp')
  })

  it('should clear liveObservations after NOTE_MATCHED', async () => {
    const store = usePracticeStore.getState()
    await store.loadExercise(mockExercise)
    await store.start()

    // 1. First some detections to generate observations
    const detections = async function* () {
      for (let i = 0; i < 10; i++) {
        yield {
          type: 'NOTE_DETECTED' as const,
          payload: {
            pitch: 'A4',
            pitchHz: 440,
            cents: 20,
            confidence: 0.9,
            timestamp: Date.now() + i * 50
          }
        }
      }
    }()
    await store.consumePipelineEvents(detections)
    expect(usePracticeStore.getState().liveObservations.length).toBeGreaterThan(0)

    // 2. Then a NOTE_MATCHED event
    const matched = async function* () {
      yield { type: 'NOTE_MATCHED' as const }
    }()
    await store.consumePipelineEvents(matched)

    expect(usePracticeStore.getState().liveObservations).toEqual([])
  })
})
