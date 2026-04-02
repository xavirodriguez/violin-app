import { describe, it, expect } from 'vitest'
import { clamp } from './ui-utils'

describe('clamp', () => {
  it('should not change the value if it is within the range', () => {
    expect(clamp({ value: 5, min: 0, max: 10 })).toBe(5)
  })

  it('should clamp the value to the minimum if it is below the range', () => {
    expect(clamp({ value: -5, min: 0, max: 10 })).toBe(0)
  })

  it('should clamp the value to the maximum if it is above the range', () => {
    expect(clamp({ value: 15, min: 0, max: 10 })).toBe(10)
  })

  it('should work with negative ranges', () => {
    expect(clamp({ value: -15, min: -10, max: 0 })).toBe(-10)
    expect(clamp({ value: 5, min: -10, max: 0 })).toBe(0)
  })

  it('should handle cases where min and max are equal', () => {
    expect(clamp({ value: 10, min: 5, max: 5 })).toBe(5)
    expect(clamp({ value: 0, min: 5, max: 5 })).toBe(5)
  })
})
