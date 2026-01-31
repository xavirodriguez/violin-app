import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { useTunerStore } from '../stores/tuner-store'
import { allExercises } from '../lib/exercises'
import { audioManager } from '../lib/infrastructure/audio-manager'

// Mock dependencies
vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn().mockResolvedValue({
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048 },
    }),
    cleanup: vi.fn().mockResolvedValue(undefined),
    getAnalyser: vi.fn(() => ({
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
    })),
    setGain: vi.fn(),
  },
}))

vi.mock('@/lib/pitch-detector', () => {
  return {
    PitchDetector: vi.fn().mockImplementation(function (this: {
      setMaxFrequency: Mock
      detectPitch: Mock
      calculateRMS: Mock
    }) {
      this.setMaxFrequency = vi.fn()
      this.detectPitch = vi.fn(() => ({ pitchHz: 0, confidence: 0 }))
      this.calculateRMS = vi.fn(() => 0)
    }),
  }
})

describe('Full Flow Verification Checklist', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    usePracticeStore.getState().reset()
    // Manual reset of TunerStore as it might not have a reset in this environment
    useTunerStore.setState({
        state: { kind: 'IDLE' },
        detector: null,
        deviceId: null,
        sensitivity: 50
    })
  })

  it('Phase 1: Initialization', async () => {
    const exercise = allExercises[0]
    usePracticeStore.getState().loadExercise(exercise)

    const state = usePracticeStore.getState().practiceState
    expect(state).not.toBeNull()
    expect(state?.exercise.notes.length).toBeGreaterThan(0)
    expect(state?.currentIndex).toBe(0)
    expect(state?.status).toBe('idle')
    expect(state?.detectionHistory).toEqual([])
  })

  it('Phase 2: Start Practice and Audio Initialization', async () => {
    const exercise = allExercises[0]
    usePracticeStore.getState().loadExercise(exercise)

    const mockAnalyser = {
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
    }
    ;(audioManager.initialize as Mock).mockResolvedValue({
      context: { sampleRate: 44100 },
      analyser: mockAnalyser,
    })
    ;(audioManager.getAnalyser as Mock).mockReturnValue(mockAnalyser)

    // Set a specific device and sensitivity in TunerStore to verify it's used
    useTunerStore.setState({ deviceId: 'test-device', sensitivity: 75 })

    await usePracticeStore.getState().start()

    // 2.1 Click "Start Practice"
    expect(usePracticeStore.getState().practiceState?.status).toBe('listening')

    // 2.2 Audio Initialization
    expect(audioManager.initialize).toHaveBeenCalledWith('test-device')
  })

  it('Phase 3: Active Loop and Events', async () => {
    const exercise = allExercises[0]
    usePracticeStore.getState().loadExercise(exercise)
    await usePracticeStore.getState().start()

    // Simulate events via consumePipelineEvents
    const detectedNote = {
      pitch: 'A4',
      pitchHz: 440,
      cents: 2,
      timestamp: Date.now(),
      confidence: 0.95,
    }

    const pipeline = async function* () {
      yield { type: 'NOTE_DETECTED' as const, payload: detectedNote }
    }()

    await usePracticeStore.getState().consumePipelineEvents(pipeline)

    expect(usePracticeStore.getState().practiceState?.detectionHistory.length).toBeGreaterThan(0)
    expect(usePracticeStore.getState().practiceState?.detectionHistory[0].pitch).toBe('A4')
  })

  it('Phase 4 & 5: Advancement and Completion', async () => {
    const exercise = allExercises[0]
    usePracticeStore.getState().loadExercise(exercise)
    await usePracticeStore.getState().start()

    // Simulate matching all notes
    const totalNotes = exercise.notes.length
    for (let i = 0; i < totalNotes; i++) {
      const p = async function* () {
        // Transition back to listening if needed
        yield {
            type: 'NOTE_DETECTED' as const,
            payload: { pitch: 'G3', pitchHz: 196, cents: 0, confidence: 1, timestamp: Date.now() }
        }
        yield {
          type: 'NOTE_MATCHED' as const,
          payload: { technique: {} as any, observations: [] },
        }
      }()
      await usePracticeStore.getState().consumePipelineEvents(p as any)
    }

    expect(usePracticeStore.getState().practiceState?.status).toBe('completed')
  })
})
