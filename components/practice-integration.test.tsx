import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { PracticeMode } from '@/components/practice-mode'
import { allExercises } from '@/lib/exercises'
import { formatPitchName } from '@/lib/practice-core'
import React from 'react'

// Mock dependencies
vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn().mockResolvedValue({
      context: { sampleRate: 44100 },
      analyser: { fftSize: 2048 }
    }),
    cleanup: vi.fn().mockResolvedValue(undefined),
    getAnalyser: vi.fn().mockReturnValue({ fftSize: 2048 }),
    setGain: vi.fn()
  }
}))

// OSMD mock
vi.mock('@/hooks/use-osmd-safe', () => ({
  useOSMDSafe: () => ({
    isReady: true,
    error: null,
    containerRef: { current: null },
    resetCursor: vi.fn(),
    advanceCursor: vi.fn(),
  })
}))

// Pipeline mock
let pipelineYields: any[] = []
let resolveNext: ((v: any) => void) | null = null

vi.mock('@/lib/note-stream', () => ({
  createRawPitchStream: vi.fn(),
  createPracticeEventPipeline: vi.fn(() => ({
    [Symbol.asyncIterator]: async function* () {
      while (true) {
        if (pipelineYields.length > 0) {
          yield pipelineYields.shift()
        } else {
          const next = await new Promise(resolve => {
            resolveNext = resolve
          })
          if (next === 'STOP') break
          yield next
        }
      }
    }
  })),
}))

async function pushEvent(event: any) {
  if (resolveNext) {
    const resolve = resolveNext
    resolveNext = null
    await act(async () => {
      resolve(event)
    })
  } else {
    pipelineYields.push(event)
  }
}

describe('Practice Mode - E2E Integration', () => {
  beforeEach(() => {
    pipelineYields = []
    resolveNext = null
    vi.clearAllMocks()
  })

  it('completes the first exercise with live feedback and advancement', async () => {
    render(<PracticeMode />)

    // 1. Initial State
    expect(screen.getAllByText(allExercises[0].name).length).toBeGreaterThan(0)

    // 2. Start practice
    const startButton = screen.getByRole('button', { name: /start practice/i })
    fireEvent.click(startButton)

    // Wait for instruction
    const firstNoteName = formatPitchName(allExercises[0].notes[0].pitch)
    await screen.findByText(new RegExp(`Play.*${firstNoteName}`, 's'))

    // 3. Simulate wrong note
    await pushEvent({
      type: 'NOTE_DETECTED',
      payload: { pitch: 'B2', cents: 0, confidence: 0.9, timestamp: Date.now() }
    })

    await screen.findByText('Wrong Note')

    // 4. Simulate correct note but consistently sharp (10 detections)
    for (let i = 0; i < 10; i++) {
      await pushEvent({
        type: 'NOTE_DETECTED',
        payload: { pitch: firstNoteName, cents: 25, confidence: 0.9, timestamp: Date.now() }
      })
    }

    await screen.findByText(/sharp/i)

    // 5. Complete exercise notes
    const exercise = allExercises[0]
    for (let i = 0; i < exercise.notes.length; i++) {
       const noteName = formatPitchName(exercise.notes[i].pitch)
       await pushEvent({
         type: 'NOTE_DETECTED',
         payload: { pitch: noteName, cents: 0, confidence: 1, timestamp: Date.now() }
       })
       await pushEvent({ type: 'NOTE_MATCHED' })
    }

    // 6. Verify completion screen
    await screen.findByText(/Exercise Complete!/i)
  })
})
