import { describe, it, expect } from 'vitest'
import { calculateAdaptiveDifficulty } from '../lib/practice-engine/engine'

describe('calculateAdaptiveDifficulty', () => {
  it('should return base difficulty for streak 0', () => {
    const diff = calculateAdaptiveDifficulty(0)
    expect(diff.centsTolerance).toBe(25)
    expect(diff.requiredHoldTime).toBe(180)
  })

  it('should decrease tolerance for streak 3', () => {
    const diff = calculateAdaptiveDifficulty(3)
    expect(diff.centsTolerance).toBe(20)
  })

  it('should not go below 15 cents floor for high streak', () => {
    const diff = calculateAdaptiveDifficulty(10)
    // 25 - floor(10/3)*5 = 25 - 3*5 = 10.
    // But with floor 15, it should be 15.
    expect(diff.centsTolerance).toBe(15)
  })

  it('should increase hold time for streak 5', () => {
    const diff = calculateAdaptiveDifficulty(5)
    expect(diff.requiredHoldTime).toBe(280)
  })

  it('should cap hold time at 800ms', () => {
    const diff = calculateAdaptiveDifficulty(50)
    expect(diff.requiredHoldTime).toBe(800)
  })
})
