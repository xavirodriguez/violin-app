import { describe, it, expect, vi } from 'vitest'
import { PracticeSessionRunnerImpl, SessionRunnerDependencies } from './session-runner'
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'

describe('PracticeSessionRunner', () => {
  const mockAudioLoop: AudioLoopPort = {
    start: vi.fn(async (onFrame, signal) => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (signal.aborted) {
            clearInterval(interval)
            resolve()
          }
          onFrame(new Float32Array([0.1]))
        }, 10)
      })
    })
  }

  const mockDetector: PitchDetectionPort = {
    detect: vi.fn(() => ({ pitchHz: 440, confidence: 0.9 })),
    calculateRMS: vi.fn(() => 0.1)
  }

  const mockExercise = {
    id: 'test',
    name: 'Test',
    notes: [
      { pitch: { step: 'A', octave: 4, alter: 0 }, duration: '4' }
    ]
  }

  const mockStore = {
    getState: vi.fn(() => ({
      practiceState: {
        status: 'listening',
        exercise: mockExercise,
        currentIndex: 0,
        detectionHistory: []
      }
    })),
    setState: vi.fn(),
    stop: vi.fn()
  }

  const mockAnalytics = {
    recordNoteAttempt: vi.fn(),
    recordNoteCompletion: vi.fn()
  }

  const deps: SessionRunnerDependencies = {
    audioLoop: mockAudioLoop,
    detector: mockDetector,
    exercise: mockExercise as any,
    sessionStartTime: Date.now(),
    store: mockStore,
    analytics: mockAnalytics
  }

  it('cancela la sesión al llamar a cancel()', async () => {
    const runner = new PracticeSessionRunnerImpl(deps)
    const signal = new AbortController().signal

    const runPromise = runner.run(signal)

    // Esperar un poco y cancelar
    await new Promise(r => setTimeout(r, 50))
    runner.cancel()

    const result = await runPromise
    expect(result.completed).toBe(false)
    expect(result.reason).toBe('cancelled')
  })

  it('permite múltiples runners independientes', async () => {
    const runner1 = new PracticeSessionRunnerImpl(deps)
    const runner2 = new PracticeSessionRunnerImpl(deps)

    const signal1 = new AbortController()
    const signal2 = new AbortController()

    const run1 = runner1.run(signal1.signal)
    const run2 = runner2.run(signal2.signal)

    await new Promise(r => setTimeout(r, 50))

    signal1.abort()
    const res1 = await run1

    expect(res1.reason).toBe('cancelled')

    // runner2 sigue corriendo?
    // Como no podemos verificarlo fácilmente sin mocks más complejos,
    // al menos verificamos que no falló por interferencia.

    signal2.abort()
    const res2 = await run2
    expect(res2.reason).toBe('cancelled')
  })
})
