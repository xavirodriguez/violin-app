import { render, screen } from '@testing-library/react'
import { PitchDebugPanel } from './PitchDebugPanel'
import { usePitchDebug } from '@/hooks/use-pitch-debug'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/use-pitch-debug', () => ({
  usePitchDebug: vi.fn(),
}))

describe('PitchDebugPanel', () => {
  it('should render waiting state when no events', () => {
    vi.mocked(usePitchDebug).mockReturnValue([])
    render(<PitchDebugPanel />)
    expect(screen.getAllByText(/Waiting for data.../i)).toHaveLength(5)
  })

  it('should render latest event for each stage', () => {
    vi.mocked(usePitchDebug).mockReturnValue([
      {
        stage: 'yin_detected',
        pitchHz: 440,
        confidence: 0.95,
        rms: 0.1,
        timestamp: Date.now(),
      },
      {
        stage: 'quality_passed',
        noteName: 'A4',
        cents: 2,
        rms: 0.1,
        confidence: 0.95,
        timestamp: Date.now(),
      },
    ])

    render(<PitchDebugPanel />)
    expect(screen.getByText(/440.0 Hz/i)).toBeTruthy()
    expect(screen.getByText(/PASSED/i)).toBeTruthy()
    expect(screen.getByText(/A4/i)).toBeTruthy()
  })
})
