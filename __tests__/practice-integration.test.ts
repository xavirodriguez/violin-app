import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { usePracticeStore } from '../stores/practice-store'
import { allExercises } from '../lib/exercises'
import { audioManager } from '../lib/infrastructure/audio-manager'
import { PracticeEvent } from '../lib/practice-core'

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

vi.mock('@/lib/pitch-detector', () => {
  return {
    PitchDetector: vi.fn().mockImplementation(function (this: any) {
      this.setMaxFrequency = vi.fn()
      this.detectPitch = vi.fn(() => ({ pitchHz: 0, confidence: 0 }))
      this.calculateRMS = vi.fn(() => 0)
    }),
  }
})

describe('Practice Mode - E2E Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    usePracticeStore.getState().reset()
  })

  it('completes a practice session with live feedback', async () => {
    const store = usePracticeStore.getState()
    const exercise = allExercises[0]

    // 1. Setup: Load exercise
    await store.loadExercise(exercise)
    expect(usePracticeStore.getState().practiceState?.status).toBe('idle')

    // 2. Start practice
    const mockContext = { sampleRate: 44100 }
    const mockAnalyser = {
      fftSize: 2048,
      getFloatTimeDomainData: vi.fn(),
      context: mockContext
    }
    ;(audioManager.initialize as Mock).mockResolvedValue({
      context: mockContext,
      analyser: mockAnalyser,
    })

    await usePracticeStore.getState().start()
    expect(usePracticeStore.getState().practiceState?.status).toBe('listening')

    // 3. Simulate events through consumePipelineEvents
    const events: PracticeEvent[] = []

    // Helper to run pipeline consumption
    const runPipeline = async () => {
      const pipeline = async function* () {
        for (const event of events) {
          yield event
        }
      }()
      await usePracticeStore.getState().consumePipelineEvents(pipeline)
    }

    // A. Simular tocar nota incorrecta (debe mostrar live feedback)
    for (let i = 0; i < 6; i++) {
      events.push({
        type: 'NOTE_DETECTED',
        payload: {
          pitch: 'A4', // Assuming target is different (e.g., G3)
          pitchHz: 440,
          cents: 0,
          confidence: 0.9,
          timestamp: Date.now()
        }
      })
    }

    await runPipeline()

    // Check live observations
    const observations = usePracticeStore.getState().liveObservations
    expect(observations.length).toBeGreaterThan(0)
    expect(observations[0].message).toContain('Playing A4')

    // B. Simular tocar nota correcta pero desafinada
    events.length = 0 // Clear previous events
    const targetNote = exercise.notes[0]
    const targetPitch = 'G3' // Based on first exercise "Open G String"

    for (let i = 0; i < 10; i++) {
      events.push({
        type: 'NOTE_DETECTED',
        payload: {
          pitch: targetPitch,
          pitchHz: 196,
          cents: 20, // Sharp
          confidence: 0.9,
          timestamp: Date.now()
        }
      })
    }

    await runPipeline()
    expect(usePracticeStore.getState().liveObservations[0].message).toContain('sharp')

    // C. Simular completar la nota
    events.length = 0
    events.push({
      type: 'NOTE_MATCHED',
      payload: { technique: {} as any, observations: [] }
    })

    await runPipeline()
    expect(usePracticeStore.getState().practiceState?.currentIndex).toBe(1)
    expect(usePracticeStore.getState().liveObservations).toEqual([])

    // D. Completar el ejercicio
    events.length = 0
    const totalNotes = exercise.notes.length
    for (let i = 1; i < totalNotes; i++) {
       // Simulate detection to transition from 'correct' back to 'listening'
       events.push({
         type: 'NOTE_DETECTED',
         payload: {
           pitch: targetPitch,
           pitchHz: 196,
           cents: 0,
           confidence: 0.9,
           timestamp: Date.now()
         }
       })
       events.push({
         type: 'NOTE_MATCHED',
         payload: { technique: {} as any, observations: [] }
       })
    }

    await runPipeline()
    expect(usePracticeStore.getState().practiceState?.status).toBe('completed')
  })
})
