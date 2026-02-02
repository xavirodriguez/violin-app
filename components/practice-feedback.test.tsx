import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeFeedback } from './practice-feedback'
import React from 'react'
import { Observation } from '@/lib/technique-types'

describe('PracticeFeedback', () => {
  beforeEach(() => {
    // Mock AudioContext for components that use it
    class MockAudioContext {
      createOscillator = vi.fn().mockReturnValue({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 }
      })
      createGain = vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        }
      })
      destination = {}
      currentTime = 0
    }
    vi.stubGlobal('AudioContext', MockAudioContext)
  })

  it('renders "Play A4" state when not playing', () => {
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
      />
    )
    expect(screen.getByText('Play A4')).toBeDefined()
  })

  it('renders "Perfect!" when in tune and correct note', () => {
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
    render(
      <PracticeFeedback
        targetNote="A4"
        detectedPitchName="A4"
        centsOff={12}
        status="listening"
      />
    )
    expect(screen.getByText('Almost!')).toBeDefined()
  })

  it('renders "Adjust" when further out of tune', () => {
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
