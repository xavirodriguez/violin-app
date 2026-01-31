import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock dependencies BEFORE other imports
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

import { usePracticeStore } from '../stores/practice-store'
import { allExercises } from '../lib/exercises'
import { audioManager } from '../lib/infrastructure/audio-manager'
import { type NoteTechnique } from '@/lib/technique-types'

describe('Practice Mode Integration Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    usePracticeStore.getState().reset()
  })

  it('should follow the complete path from initialization to completion', async () => {
    const exercise = allExercises[0]

    // 1. PHASE 1: Initialization
    usePracticeStore.getState().loadExercise(exercise)

    expect(usePracticeStore.getState().practiceState).toBeDefined()
    expect(usePracticeStore.getState().practiceState?.exercise.id).toBe(exercise.id)
    expect(usePracticeStore.getState().practiceState?.status).toBe('idle')
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(0)

    // 2. PHASE 2: Start Practice
    await usePracticeStore.getState().start()

    expect(usePracticeStore.getState().practiceState?.status).toBe('listening')
    expect(audioManager.initialize).toHaveBeenCalled()

    // 3. PHASE 3 & 4: Detection and Advancement

    // Simulate NOTE_DETECTED
    const detectionEvent = {
      type: 'NOTE_DETECTED' as const,
      payload: { pitch: 'G3', pitchHz: 196, cents: 0, timestamp: Date.now(), confidence: 0.9 },
    }

    const pipeline1 = async function* () {
      yield detectionEvent
    }()

    await usePracticeStore.getState().consumePipelineEvents(pipeline1)
    expect(usePracticeStore.getState().practiceState?.detectionHistory.length).toBeGreaterThan(0)

    // Simulate NOTE_MATCHED
    const matchedEvent = {
      type: 'NOTE_MATCHED' as const,
      payload: { technique: {} as unknown as NoteTechnique, observations: [] },
    }

    const pipeline2 = async function* () {
      yield matchedEvent
    }()

    await usePracticeStore.getState().consumePipelineEvents(pipeline2)

    // Status should be 'correct' (transiently) and index should increment
    expect(usePracticeStore.getState().practiceState?.status).toBe('correct')
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(1)

    // Move to the last note
    const totalNotes = exercise.notes.length
    for (let i = 1; i < totalNotes - 1; i++) {
      const p = async function* () {
        // Must transition back to listening before matching
        yield { type: 'NOTE_DETECTED' as const, payload: { pitch: 'G3', cents: 0, confidence: 1, timestamp: Date.now() } }
        yield { type: 'NOTE_MATCHED' as const }
      }()
      await usePracticeStore.getState().consumePipelineEvents(p as any)
    }

    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(totalNotes - 1)

    // Final note match
    const pFinal = async function* () {
      yield { type: 'NOTE_DETECTED' as const, payload: { pitch: 'G3', cents: 0, confidence: 1, timestamp: Date.now() } }
      yield { type: 'NOTE_MATCHED' as const }
    }()
    await usePracticeStore.getState().consumePipelineEvents(pFinal as any)
    expect(usePracticeStore.getState().practiceState?.status).toBe('completed')
  })

  it('should handle microphone permission denial', async () => {
    const exercise = allExercises[0]
    usePracticeStore.getState().loadExercise(exercise)

    const permissionError = new Error('Permission denied')
    permissionError.name = 'NotAllowedError'
    ;(audioManager.initialize as Mock).mockRejectedValue(permissionError)

    await usePracticeStore.getState().start()

    const error = usePracticeStore.getState().error
    expect(error).toBeDefined()
    expect(error).toContain('denied')
    expect(usePracticeStore.getState().practiceState?.status).toBe('idle')
  })

  it('should handle microphone not found', async () => {
    const exercise = allExercises[0]
    usePracticeStore.getState().loadExercise(exercise)

    const notFoundError = new Error('Device not found')
    notFoundError.name = 'NotFoundError'
    ;(audioManager.initialize as Mock).mockRejectedValue(notFoundError)

    await usePracticeStore.getState().start()

    const error = usePracticeStore.getState().error
    expect(error).toBeDefined()
    expect(error).toContain('found')
  })
})
