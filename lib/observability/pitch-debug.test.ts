import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pitchDebugBus, PitchDebugEvent } from './pitch-debug'
import { logger } from './logger'

vi.mock('./logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}))

describe('pitchDebugBus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should emit events to listeners', () => {
    const listener = vi.fn()
    const unsubscribe = pitchDebugBus.subscribe(listener)

    const event: PitchDebugEvent = {
      stage: 'raw_audio',
      rms: 0.1,
      timestamp: Date.now(),
    }

    pitchDebugBus.emit(event)

    expect(listener).toHaveBeenCalledWith(event)
    expect(logger.debug).toHaveBeenCalled()

    unsubscribe()
  })

  it('should not notify listeners after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = pitchDebugBus.subscribe(listener)
    unsubscribe()

    const event: PitchDebugEvent = {
      stage: 'raw_audio',
      rms: 0.1,
      timestamp: Date.now(),
    }

    pitchDebugBus.emit(event)

    expect(listener).not.toHaveBeenCalled()
  })

  it('should handle errors in listeners gracefully', () => {
    const listener = vi.fn(() => {
      throw new Error('Listener error')
    })
    const unsubscribe = pitchDebugBus.subscribe(listener)

    const event: PitchDebugEvent = {
      stage: 'raw_audio',
      rms: 0.1,
      timestamp: Date.now(),
    }

    // Should not throw
    pitchDebugBus.emit(event)

    expect(listener).toHaveBeenCalled()
    unsubscribe()
  })
})
