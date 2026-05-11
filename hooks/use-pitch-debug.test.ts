import { renderHook, act } from '@testing-library/react'
import { usePitchDebug } from './use-pitch-debug'
import { pitchDebugBus } from '@/lib/observability/pitch-debug'
import { describe, it, expect } from 'vitest'

describe('usePitchDebug', () => {
  it('should collect events from the bus', () => {
    const { result } = renderHook(() => usePitchDebug())

    act(() => {
      pitchDebugBus.emit({ stage: 'raw_audio', rms: 0.1, timestamp: 1000 })
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].stage).toBe('raw_audio')
  })

  it('should limit the number of events', () => {
    const maxEvents = 5
    const { result } = renderHook(() => usePitchDebug(maxEvents))

    act(() => {
      for (let i = 0; i < 10; i++) {
        pitchDebugBus.emit({ stage: 'raw_audio', rms: i, timestamp: i })
      }
    })

    expect(result.current).toHaveLength(maxEvents)
    expect(result.current[maxEvents - 1].rms).toBe(9)
  })
})
