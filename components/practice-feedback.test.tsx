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
  it('renders "Listening" state when not playing', () => {
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
    expect(screen.getByText('Target Note')).toBeDefined()
    expect(screen.getByText('A4')).toBeDefined()
    expect(screen.getByText('Listening...')).toBeDefined()
    expect(screen.getByText('👂')).toBeDefined()
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
      />
    )
    expect(screen.getByText('Perfect!')).toBeDefined()
    expect(screen.getByText('🎉')).toBeDefined()
  })

  it('renders "Great!" when in tune at beginner level', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'beginner',
      showTechnicalDetails: false,
    })

    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={12} // Within 25 cents tolerance for beginner
        status="listening"
        centsTolerance={10}
      />
    )
    expect(screen.getByText('Great!')).toBeDefined()
    expect(screen.getByText('😊')).toBeDefined()
  })

  it('renders technical cents when at advanced level', () => {
    (usePreferencesStore as any).mockReturnValue({
      feedbackLevel: 'advanced',
      showTechnicalDetails: false,
    })

    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={12} // Outside 10 cents tolerance for advanced
        status="listening"
      />
    )
    // At advanced level, visualStyle is 'technical', so it shows cents
    expect(screen.getByText('+12.0¢')).toBeDefined()
    expect(screen.getByText('Too Sharp')).toBeDefined()
  })

  it('renders "Wrong note" when playing different note', () => {
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
    expect(screen.getByText('Wrong note')).toBeDefined()
    expect(screen.getByText('🤔')).toBeDefined()
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
