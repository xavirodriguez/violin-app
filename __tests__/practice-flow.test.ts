import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock dependencies BEFORE other imports
vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn(),
    cleanup: vi.fn(),
    getAnalyser: vi.fn(() => ({
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
    })),
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

vi.mock('@/lib/practice/session-runner', () => ({
  runPracticeSession: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
}))

import { usePracticeStore } from '../stores/practice-store'
import { allExercises } from '../lib/exercises'
import { audioManager } from '../lib/infrastructure/audio-manager'
import { ERROR_CODES } from '../lib/errors/app-error'
import { handlePracticeEvent } from '../lib/practice/practice-event-sink'
import { type NoteTechnique } from '@/lib/technique-types'

describe('Practice Mode Integration Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await usePracticeStore.getState().reset()
  })

  it('should follow the complete path from initialization to completion', async () => {
    const exercise = allExercises[0]

    // 1. PHASE 1: Initialization
    await usePracticeStore.getState().loadExercise(exercise)

    expect(usePracticeStore.getState().practiceState).toBeDefined()
    expect(usePracticeStore.getState().practiceState?.exercise.id).toBe(exercise.id)
    expect(usePracticeStore.getState().practiceState?.status).toBe('idle')
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(0)

    // 2. PHASE 2: Start Practice
    const mockContext = { sampleRate: 44100 }
    const mockAnalyser = {
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
    }
    ;(audioManager.initialize as Mock).mockResolvedValue({
      context: mockContext,
      analyser: mockAnalyser,
    })
    ;(audioManager.getAnalyser as Mock).mockReturnValue(mockAnalyser)

    await usePracticeStore.getState().start()

    expect(usePracticeStore.getState().practiceState?.status).toBe('listening')
    expect(audioManager.initialize).toHaveBeenCalled()

    // 3. PHASE 3 & 4: Detection and Advancement
    const targetNote = usePracticeStore.getState().practiceState?.exercise.notes[0]
    expect(targetNote).toBeDefined()

    const storeApi = {
      getState: usePracticeStore.getState,
      setState: usePracticeStore.setState,
    }

    // Simulate NOTE_DETECTED
    handlePracticeEvent(
      {
        type: 'NOTE_DETECTED',
        payload: { pitch: 'A4', cents: 10, timestamp: Date.now(), confidence: 0.9 },
      },
      storeApi,
      () => {},
    )
    expect(usePracticeStore.getState().practiceState?.detectionHistory.length).toBeGreaterThan(0)

    // Simulate HOLDING_NOTE
    handlePracticeEvent({ type: 'HOLDING_NOTE', payload: { duration: 250 } }, storeApi, () => {})
    expect(usePracticeStore.getState().practiceState?.status).toBe('validating')
    expect(usePracticeStore.getState().practiceState?.holdDuration).toBe(250)

    // Simulate NOTE_MATCHED
    handlePracticeEvent(
      {
        type: 'NOTE_MATCHED',
        payload: { technique: {} as unknown as NoteTechnique, observations: [] },
      },
      storeApi,
      () => {},
    )

    // Status should be 'correct' (transiently) and index should increment
    expect(usePracticeStore.getState().practiceState?.status).toBe('correct')
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(1)
    expect(usePracticeStore.getState().practiceState?.holdDuration).toBe(0)

    // Simulate next note detection (should reset status to listening)
    handlePracticeEvent(
      {
        type: 'NOTE_DETECTED',
        payload: { pitch: 'A4', cents: 0, timestamp: Date.now(), confidence: 1 },
      },
      storeApi,
      () => {},
    )
    expect(usePracticeStore.getState().practiceState?.status).toBe('listening')

    // 4. PHASE 5: Completion
    // Move to the last note
    const totalNotes = exercise.notes.length
    for (let i = 1; i < totalNotes - 1; i++) {
      // Reset status to listening by detecting a note
      handlePracticeEvent(
        {
          type: 'NOTE_DETECTED',
          payload: { pitch: 'A4', cents: 0, timestamp: Date.now(), confidence: 1 },
        },
        storeApi,
        () => {},
      )

      handlePracticeEvent(
        {
          type: 'NOTE_MATCHED',
          payload: { technique: {} as unknown as NoteTechnique, observations: [] },
        },
        storeApi,
        () => {},
      )
    }

    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(totalNotes - 1)

    // Final note match
    handlePracticeEvent(
      {
        type: 'NOTE_DETECTED',
        payload: { pitch: 'A4', cents: 0, timestamp: Date.now(), confidence: 1 },
      },
      storeApi,
      () => {},
    )

    handlePracticeEvent(
      {
        type: 'NOTE_MATCHED',
        payload: { technique: {} as unknown as NoteTechnique, observations: [] },
      },
      storeApi,
      () => {},
    )
    expect(usePracticeStore.getState().practiceState?.status).toBe('completed')
  })

  it('should handle microphone permission denial', async () => {
    const exercise = allExercises[0]
    await usePracticeStore.getState().loadExercise(exercise)

    const permissionError = new Error('Permission denied')
    permissionError.name = 'NotAllowedError'
    ;(audioManager.initialize as Mock).mockRejectedValue(permissionError)

    await usePracticeStore.getState().start()

    const error = usePracticeStore.getState().error
    expect(error).toBeDefined()
    expect(error?.code).toBe(ERROR_CODES.MIC_PERMISSION_DENIED)
    expect(usePracticeStore.getState().practiceState?.status).toBe('idle')
  })

  it('should handle microphone not found', async () => {
    const exercise = allExercises[0]
    await usePracticeStore.getState().loadExercise(exercise)

    const notFoundError = new Error('Device not found')
    notFoundError.name = 'NotFoundError'
    ;(audioManager.initialize as Mock).mockRejectedValue(notFoundError)

    await usePracticeStore.getState().start()

    const error = usePracticeStore.getState().error
    expect(error).toBeDefined()
    expect(error?.code).toBe(ERROR_CODES.MIC_NOT_FOUND)
  })
})
