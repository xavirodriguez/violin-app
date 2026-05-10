import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeMode } from '../components/practice-mode'
import { usePracticeStore } from '../stores/practice-store'

vi.mock('@/hooks/use-osmd-safe', () => ({
  useOSMDSafe: () => ({
    isReady: true,
    error: null,
    containerRef: { current: null },
    scoreView: {
      sync: vi.fn(),
      highlight: vi.fn(),
    },
  }),
}))

vi.mock('@/lib/infrastructure/audio-manager', () => ({
  audioManager: {
    initialize: vi.fn().mockResolvedValue({ analyser: {} }),
    cleanup: vi.fn(),
    getContext: vi.fn().mockReturnValue({ sampleRate: 44100 }),
    getAnalyser: vi.fn().mockReturnValue({}),
  },
}))

describe('PracticeMode Initialization Flow', () => {
  beforeEach(() => {
    usePracticeStore.setState({
      status: 'idle',
      exercise: undefined,
      practiceState: undefined,
      error: undefined,
    })
  })

  it('should auto-load an exercise and show start button', async () => {
    render(<PracticeMode />)
    const startButton = await screen.findByRole('button', { name: /Empezar/i })
    expect(startButton).toBeTruthy()
  })
})
