import { describe, it, expect } from 'vitest'
import { getTunerFeedbackMessage } from '../lib/tuner-utils'

describe('getTunerFeedbackMessage', () => {
  const thresholds = {
    tooLow: -35,
    bitLow: -10,
    bitHigh: 10,
    tooHigh: 35,
  }

  it('returns playNote message when confidence is low', () => {
    expect(getTunerFeedbackMessage(0, 0.4, 'en', thresholds)).toBe('Play a note')
    expect(getTunerFeedbackMessage(0, 0.4, 'es', thresholds)).toBe('Toca una cuerda')
  })

  it('returns weakSignal message when confidence is medium', () => {
    expect(getTunerFeedbackMessage(0, 0.7, 'en', thresholds)).toBe('Weak signal. Play louder or move closer.')
    expect(getTunerFeedbackMessage(0, 0.7, 'es', thresholds)).toBe('Señal débil. Toca más fuerte o acércate al micrófono.')
  })

  it('returns inTune message when cents are within bitLow/bitHigh', () => {
    expect(getTunerFeedbackMessage(5, 0.9, 'en', thresholds)).toBe('In Tune')
    expect(getTunerFeedbackMessage(-5, 0.9, 'es', thresholds)).toBe('Afinado')
  })

  it('returns bitLow message correctly', () => {
    expect(getTunerFeedbackMessage(-20, 0.9, 'en', thresholds)).toBe('A bit low.')
    expect(getTunerFeedbackMessage(-20, 0.9, 'es', thresholds)).toBe('Un poco bajo.')
  })

  it('returns tooLow message correctly', () => {
    expect(getTunerFeedbackMessage(-40, 0.9, 'en', thresholds)).toBe('Too low. Tune up.')
    expect(getTunerFeedbackMessage(-40, 0.9, 'es', thresholds)).toBe('Muy bajo. Sube un poco.')
  })

  it('returns bitHigh message correctly', () => {
    expect(getTunerFeedbackMessage(20, 0.9, 'en', thresholds)).toBe('A bit high.')
    expect(getTunerFeedbackMessage(20, 0.9, 'es', thresholds)).toBe('Un poco alto.')
  })

  it('returns tooHigh message correctly', () => {
    expect(getTunerFeedbackMessage(40, 0.9, 'en', thresholds)).toBe('Too high. Tune down.')
    expect(getTunerFeedbackMessage(40, 0.9, 'es', thresholds)).toBe('Muy alto. Baja un poco.')
  })
})
