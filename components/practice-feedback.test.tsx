import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeFeedback } from './practice-feedback'
import React from 'react'
import { Observation } from '@/lib/technique-types'
import { usePreferencesStore } from '@/stores/preferences-store'

// Mock the preferences store to control feedback levels in tests
vi.mock('@/stores/preferences-store', () => ({
  usePreferencesStore: vi.fn(),
}))

describe('PracticeFeedback', () => {
  it('renders "Play A4" state when not playing', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'beginner',
      showTechnicalDetails: false,
    })

    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
      />
    )
    expect(screen.getByText('Play A4')).toBeDefined()
  })

  it('renders "Perfect!" when in tune and correct note', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'beginner',
      showTechnicalDetails: false,
    })

    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={5}
        status="correct"
        centsTolerance={10}
      />
    )
    expect(screen.getByText('Perfect!')).toBeDefined()
  })

  it('renders "Almost!" when slightly out of tune', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'beginner',
      showTechnicalDetails: false,
    })

    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={12}
        status="listening"
        centsTolerance={10}
      />
    )
    expect(screen.getByText('Almost!')).toBeDefined()
  })

  it('renders "Adjust" when further out of tune', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'beginner',
      showTechnicalDetails: false,
    })

    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={20}
        status="listening"
        centsTolerance={10}
      />
    )
    expect(screen.getByText('Adjust')).toBeDefined()
  })

  it('renders "Wrong Note" when playing different note', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'beginner',
      showTechnicalDetails: false,
    })

    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="G4"
        centsOff={0}
        status="listening"
      />
    )
    expect(screen.getByText('Wrong Note')).toBeDefined()
  })

  it('renders live feedback observations', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'beginner',
      showTechnicalDetails: false,
    })

    const liveObservations: Observation[] = [
      {
        type: 'intonation',
        severity: 2,
        confidence: 0.9,
        message: 'Consistently sharp',
        tip: 'Move finger down',
      },
    ]
    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={12}
        status="listening"
        liveObservations={liveObservations}
      />
    )
    expect(screen.getByText('Live Feedback')).toBeDefined()
    expect(screen.getByText('Consistently sharp')).toBeDefined()
  })
})
