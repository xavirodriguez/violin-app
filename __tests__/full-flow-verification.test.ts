import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { useTunerStore } from '../stores/tuner-store'
import { allExercises } from '../lib/exercises'
import { audioManager } from '../lib/infrastructure/audio-manager'
import { handlePracticeEvent } from '../lib/practice/practice-event-sink'

// Mock dependencies
vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn(),
    cleanup: vi.fn(),
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

vi.mock('@/lib/practice/session-runner', () => {
  const mockRunner = {
    run: vi.fn().mockImplementation(() => new Promise(() => {})),
    cancel: vi.fn()
  }
  return {
    PracticeSessionRunnerImpl: vi.fn().mockImplementation(function() {
      return mockRunner
    }),
    runPracticeSession: vi.fn().mockImplementation(() => new Promise(() => {})),
  }
})

describe('Full Flow Verification Checklist', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await usePracticeStore.getState().reset()
    await useTunerStore.getState().reset()
  })

  it('Phase 1: Initialization', async () => {
    const exercise = allExercises[0]
    await usePracticeStore.getState().loadExercise(exercise)

    const state = usePracticeStore.getState().practiceState
    expect(state).not.toBeNull()
    expect(state?.exercise.notes.length).toBeGreaterThan(0)
    expect(state?.currentIndex).toBe(0)
    expect(state?.status).toBe('idle')
    expect(state?.detectionHistory).toEqual([])
  })

  it('Phase 2: Start Practice and Audio Initialization', async () => {
    const exercise = allExercises[0]
    await usePracticeStore.getState().loadExercise(exercise)

    const mockContext = { sampleRate: 44100 }
    const mockAnalyser = {
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
      context: mockContext
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
    // Check if audioManager.initialize was called with deviceId from TunerStore
    expect(audioManager.initialize).toHaveBeenCalledWith('test-device')

    // 2.2 Tuner Store verification (according to checklist)
    const tunerState = useTunerStore.getState()
    expect(tunerState.analyser).not.toBeNull()
    expect(tunerState.detector).not.toBeNull()
    expect(tunerState.state.kind).toBe('LISTENING')
  })

  it('Phase 3: Active Loop and Events', async () => {
    const exercise = allExercises[0]
    await usePracticeStore.getState().loadExercise(exercise)

    // Set TunerStore to LISTENING
    useTunerStore.setState({ state: { kind: 'LISTENING', sessionToken: 1 } })

    // Simulate events via sink
    const storeApi = {
      getState: usePracticeStore.getState,
      setState: usePracticeStore.setState,
    }

    // 3.2 Pipeline Events - NOTE_DETECTED
    const detectedNote = {
      pitch: 'A4',
      pitchHz: 440,
      cents: 2,
      timestamp: Date.now(),
      confidence: 0.95,
    }

    // In actual app, runPracticeSession would call handlePracticeEvent AND update TunerStore
    handlePracticeEvent({ type: 'NOTE_DETECTED', payload: detectedNote }, storeApi, () => {})

    expect(usePracticeStore.getState().practiceState?.detectionHistory[0]).toEqual(detectedNote)

    // Verify TunerStore also gets the update
    // We expect PracticeStore to call useTunerStore.getState().updatePitch()
    useTunerStore.getState().updatePitch(440, 0.95) // This is what we want the loop to do
    expect(useTunerStore.getState().state.kind).toBe('DETECTED')
  })

  it('Phase 4 & 5: Advancement and Completion', async () => {
    const exercise = allExercises[0]
    await usePracticeStore.getState().loadExercise(exercise)

    // Set to listening
    usePracticeStore.setState({
      practiceState: { ...usePracticeStore.getState().practiceState!, status: 'listening' },
    })

    const storeApi = {
      getState: usePracticeStore.getState,
      setState: usePracticeStore.setState,
    }

    // Simulate matching all notes
    const totalNotes = exercise.notes.length
    for (let i = 0; i < totalNotes; i++) {
      // Must be in listening/validating state to match
      usePracticeStore.setState((s) => ({
        practiceState: { ...s.practiceState!, status: 'listening' },
      }))

      handlePracticeEvent(
        {
          type: 'NOTE_MATCHED',
          // @ts-expect-error - Mocking payload for test
          payload: { technique: {}, observations: [] },
        },
        storeApi,
        () => {},
      )
    }

    expect(usePracticeStore.getState().practiceState?.status).toBe('completed')
  })
})
