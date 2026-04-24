import { describe, it, expect } from 'vitest'
import { transitions } from './practice-states'
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { PracticeSessionRunner } from './session-runner'
import type { MockExercise } from '@/lib/testing/mock-types'
import { Exercise } from '@/lib/exercises/types'
import { AppError } from '@/lib/errors/app-error'

describe('Practice state transitions', () => {
  const mockAudioLoop = {} as AudioLoopPort
  const mockDetector = {} as PitchDetectionPort
  const mockExercise = { id: 'ex1', name: 'Ex 1', notes: [] } as MockExercise
  const mockRunner = {} as PracticeSessionRunner

  it('permite el flujo completo de estados', () => {
    const idle = transitions.reset()
    expect(idle.status).toBe('idle')

    const init = transitions.initialize()
    expect(init.status).toBe('initializing')

    const ready = transitions.ready({
      audioLoop: mockAudioLoop,
      detector: mockDetector,
      exercise: mockExercise as Exercise,
    })
    expect(ready.status).toBe('ready')

    const active = transitions.start(ready, mockRunner, new AbortController())
    expect(active.status).toBe('active')
    expect(active.runner).toBe(mockRunner)

    const stop = transitions.stop(active)
    expect(stop.status).toBe('idle')
    expect(stop.exercise).toBe(mockExercise as Exercise)

    const error = transitions.error({ message: 'fail' } as unknown as AppError)
    expect(error.status).toBe('error')
    expect(error.error.message).toBe('fail')
  })
})
