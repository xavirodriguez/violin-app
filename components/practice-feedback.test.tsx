import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeFeedback } from './practice-feedback'
import React from 'react'

describe('PracticeFeedback', () => {
  it('renders target note', () => {
    render(<PracticeFeedback targetNote="A4" status="listening" />)
    expect(screen.getByText('A4')).toBeDefined()
  })

  it('renders technique observations when provided', () => {
    const observations = [
      {
        type: 'vibrato' as const,
        severity: 2 as const,
        confidence: 0.9,
        message: 'Slow vibrato detected',
        tip: 'Try to increase the speed'
      }
    ]
    render(
      <PracticeFeedback
        targetNote="A4"
        status="listening"
        observations={observations}
      />
    )
    expect(screen.getByText('Slow vibrato detected')).toBeDefined()
  })
})
