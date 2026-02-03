import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PracticeMode } from '../components/practice-mode'
import { usePracticeStore } from '../stores/practice-store'
import { allExercises } from '../lib/exercises'
import React from 'react'

// Mock OSMD and hooks to avoid canvas issues in JSDOM
vi.mock('@/hooks/use-osmd-safe', () => ({
  useOSMDSafe: vi.fn(() => ({
    isReady: true,
    error: null,
    containerRef: { current: null },
    resetCursor: vi.fn(),
    advanceCursor: vi.fn(),
    highlightCurrentNote: vi.fn(),
    osmd: null,
  })),
}))

// Mock Framer Motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    circle: (props: any) => <circle {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('Initialization Flow Verification', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    usePracticeStore.getState().reset()
  })

  it('should auto-load the first exercise and show Start Practice button when idle', async () => {
    render(<PracticeMode />)

    // Verify auto-load: practiceState should be set to the first exercise
    await waitFor(() => {
      const state = usePracticeStore.getState().practiceState
      expect(state).not.toBeNull()
      expect(state?.exercise.id).toBe(allExercises[0].id)
    })

    // Verify UI visibility: PracticeControls should be visible with "Start Practice" button
    // The button has text "Start Practice"
    const startButton = await screen.findByRole('button', { name: /start practice/i })
    expect(startButton).toBeTruthy()

    // Verify Exercise Library is also visible below
    expect(screen.getByText(/exercise library/i)).toBeTruthy()
  })
})
