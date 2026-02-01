import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeFeedback } from './practice-feedback'
import React from 'react'
import { Observation } from '@/lib/technique-types'

describe('PracticeFeedback', () => {
  it('renders "Waiting" state (Play targetNote) when not playing', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
      />
    )
    expect(screen.getByText(/Play A4/i)).toBeDefined()
    expect(screen.getByText('🎻')).toBeDefined()
  })

  it('renders "Perfect!" when in tune and correct note', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={5}
        status="listening"
      />
    )
    const element = screen.getByText('Perfect!')
    expect(element.className).toContain('text-4xl')
  })

  it('renders directional arrow and "Adjust" when out of tune', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={-18}
        status="listening"
      />
    )
    const arrow = screen.getByText('↓')
    expect(arrow.className).toContain('text-8xl')
    expect(screen.getByText('Move finger up')).toBeDefined()
  })

  it('renders "Wrong Note" when playing different note', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="G4"
        status="listening"
      />
    )
    expect(screen.getByText('Wrong Note')).toBeDefined()
    expect(screen.getByText('G4')).toBeDefined()
  })

  it('renders live feedback observations', () => {
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

  it('technical details are inside collapsible element', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={12}
        status="listening"
      />
    )
    const summary = screen.getByText('Show Technical Details')
    expect(summary).toBeDefined()
    const details = summary.closest('details')
    expect(details).not.toBeNull()
  })
})
