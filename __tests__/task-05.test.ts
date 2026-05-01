import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProgressStore } from '../stores/progress.store'
import { calculateCentsTolerance } from '../stores/practice-store'

vi.mock('../stores/progress.store', () => ({
  useProgressStore: {
    getState: vi.fn()
  }
}))

describe('calculateCentsTolerance floor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not go below 15 cents even with 100 skill', () => {
    // @ts-expect-error - testing with partial progress state
    vi.mocked(useProgressStore.getState).mockReturnValue({
      intonationSkill: 100,
    })

    const tolerance = calculateCentsTolerance()
    expect(tolerance).toBe(15)
  })

  it('should return 35 cents with 0 skill', () => {
    // @ts-expect-error - testing with partial progress state
    vi.mocked(useProgressStore.getState).mockReturnValue({
      intonationSkill: 0,
    })

    const tolerance = calculateCentsTolerance()
    expect(tolerance).toBe(35)
  })

  it('should respect floor for intermediate skill that would go below 15', () => {
    // base (35) - skillBonus (0.9 * 25 = 22.5) = 12.5 -> 13 rounded.
    // @ts-expect-error - testing with partial progress state
    vi.mocked(useProgressStore.getState).mockReturnValue({
      intonationSkill: 90,
    })

    const tolerance = calculateCentsTolerance()
    expect(tolerance).toBe(15)
  })
})
