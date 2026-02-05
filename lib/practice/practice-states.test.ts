import { describe, it, expect } from 'vitest'
import { transitions } from './practice-states'
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { PracticeSessionRunner } from './session-runner'

describe('Practice state transitions', () => {
  const mockAudioLoop = {} as AudioLoopPort
  const mockDetector = {} as PitchDetectionPort
  const mockExercise = { id: 'ex1', name: 'Ex 1', notes: [] } as any
  const mockRunner = {} as PracticeSessionRunner

  it('permite el flujo completo de estados', () => {
    const idle = transitions.reset()
    expect(idle.status).toBe('idle')

    const init = transitions.initialize()
    expect(init.status).toBe('initializing')

    const ready = transitions.ready({
      audioLoop: mockAudioLoop,
      detector: mockDetector,
      exercise: mockExercise
    })
    expect(ready.status).toBe('ready')

    const active = transitions.start(ready, mockRunner, new AbortController())
    expect(active.status).toBe('active')
    expect(active.runner).toBe(mockRunner)

    const stop = transitions.stop(active)
    expect(stop.status).toBe('ready')
    expect(stop.audioLoop).toBe(mockAudioLoop)

    const error = transitions.error({ message: 'fail' } as any)
    expect(error.status).toBe('error')
    expect(error.error.message).toBe('fail')
  })
})
