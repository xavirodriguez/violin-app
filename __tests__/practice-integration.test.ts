import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import type { Exercise } from '../lib/exercises/types'

vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    setGain: vi.fn(),
    getAnalyser: vi.fn(),
    getContext: vi.fn(),
  },
}))

vi.mock('@/lib/pitch-detector', () => {
  const MockDetector = vi.fn().mockImplementation(() => ({
    setMaxFrequency: vi.fn(),
    detectPitch: vi.fn(() => ({ pitchHz: 0, confidence: 0 })),
    detectPitchWithValidation: vi.fn(() => ({ pitchHz: 0, confidence: 0 })),
    calculateRMS: vi.fn(() => 0),
    getFrequencyRange: vi.fn(() => ({ min: 180, max: 1320 })),
  }))
  return {
    PitchDetector: MockDetector,
    createPitchDetectorForDifficulty: vi.fn().mockImplementation(() => new (MockDetector as unknown as { new (): unknown })()),
  }
})

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

  it('should initialize with undefined practiceState', () => {
    const store = usePracticeStore.getState()
    expect(store.practiceState).toBeUndefined()
  })

  it('loadExercise should set initial state', async () => {
    const store = usePracticeStore.getState()
    store.loadExercise(mockExercise)

    expect(usePracticeStore.getState().practiceState).toBeDefined()
    expect(usePracticeStore.getState().practiceState?.exercise.id).toBe('test-exercise')
  })

  it('internalUpdate should process NOTE_DETECTED and update state', async () => {
    const store = usePracticeStore.getState()
    store.loadExercise(mockExercise)

    const mockDetection = {
      pitch: 'A4',
      pitchHz: 440,
      cents: 5,
      confidence: 0.9,
      timestamp: Date.now(),
    }

    store.internalUpdate({ type: 'NOTE_DETECTED', payload: mockDetection })

    const state = usePracticeStore.getState().practiceState
    expect(state?.detectionHistory.length).toBe(1)
    expect(state?.detectionHistory[0].pitch).toBe('A4')
  })

  it('should transition to next note on NOTE_MATCHED', () => {
    const store = usePracticeStore.getState()
    store.loadExercise(mockExercise)
    // The reducer requires 'listening' or 'validating' to accept NOTE_MATCHED
    // We need to trigger START through internalUpdate because store.start() fails in test due to constructors/mocks
    store.internalUpdate({ type: 'START', payload: { startIndex: 0 } })
    store.internalUpdate({ type: 'NOTE_DETECTED', payload: { pitch: 'A4', pitchHz: 440, cents: 0, confidence: 1, timestamp: Date.now() } })

    const state1 = usePracticeStore.getState().practiceState
    expect(state1?.currentIndex).toBe(0)
    expect(state1?.status).toBe('listening')

    store.internalUpdate({ type: 'NOTE_MATCHED', payload: { isPerfect: true, technique: {} } as unknown as Parameters<typeof store.internalUpdate>[0] extends { type: 'NOTE_MATCHED', payload: infer P } ? P : never })

    const state2 = usePracticeStore.getState().practiceState
    expect(state2?.currentIndex).toBe(1)
  })

  it('should complete exercise after last note MATCHED', () => {
    const store = usePracticeStore.getState()
    store.loadExercise(mockExercise)
    store.internalUpdate({ type: 'START', payload: { startIndex: 0 } })
    store.internalUpdate({ type: 'NOTE_DETECTED', payload: { pitch: 'A4', pitchHz: 440, cents: 0, confidence: 1, timestamp: Date.now() } })

    // Jump to last note (index 1)
    store.internalUpdate({ type: 'JUMP_TO_NOTE', payload: { index: 1 } })
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(1)

    store.internalUpdate({ type: 'NOTE_MATCHED', payload: { isPerfect: true, technique: {} } as unknown as Parameters<typeof store.internalUpdate>[0] extends { type: 'NOTE_MATCHED', payload: infer P } ? P : never })

    expect(usePracticeStore.getState().practiceState?.status).toBe('completed')
  })
})
