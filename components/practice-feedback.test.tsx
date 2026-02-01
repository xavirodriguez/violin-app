import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeFeedback } from './practice-feedback'
import React from 'react'
import { Observation } from '@/lib/technique-types'

describe('PracticeFeedback', () => {
  it('renders waiting state (Level 1)', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
      />
    )
    expect(screen.getByText('Play A4')).toBeDefined()
    expect(screen.getByText('🎻')).toBeDefined()
  })

  it('renders "Perfect!" when in tune (Level 1)', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
        detectedPitchName="A4"
        centsOff={5}
      />,
    )
    expect(screen.getByText('Perfect!')).toBeDefined()
  })

  it('renders directional arrow when out of tune (Level 1)', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
        detectedPitchName="A4"
        centsOff={-18}
      />,
    )
    expect(screen.getByText('↓')).toBeDefined()
    expect(screen.getByText('Move finger up')).toBeDefined()
    expect(screen.getByText('Adjust')).toBeDefined()
  })

  it('renders "Wrong Note" when pitch mismatch (Level 1)', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
        detectedPitchName="G4"
        centsOff={0}
      />,
    )
    expect(screen.getByText('Wrong Note')).toBeDefined()
    expect(screen.getByText('G4')).toBeDefined()
  })

  it('renders technical details in collapsible section (Level 2)', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
        detectedPitchName="A4"
        centsOff={12}
      />,
    )
    expect(screen.getByText('Show Technical Details')).toBeDefined()
    expect(screen.getByText('+12.0¢')).toBeDefined()
  })

  it('renders live observations (Level 3)', () => {
    const observations = [
      {
        type: 'intonation' as const,
        severity: 2 as const,
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

  it('technical details are inside collapsible element', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={12}
        status="listening"
        detectedPitchName="A4"
        centsOff={15}
        liveObservations={observations}
      />,
    )
    expect(screen.getByText('Live Feedback')).toBeDefined()
    expect(screen.getByText('Consistently sharp')).toBeDefined()
  })
})
