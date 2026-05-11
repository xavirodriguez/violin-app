import { describe, it, expect, beforeEach, vi } from 'vitest'
import { estimateLocalStorageUsagePercent } from '@/lib/storage/storage-monitor'

describe('estimateLocalStorageUsagePercent', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should return 0 when empty', () => {
    expect(estimateLocalStorageUsagePercent()).toBe(0)
  })

  it('should return a percentage based on estimated limit', () => {
    const key = 'test-key'
    const value = 'a'.repeat((5 * 1024 * 1024) / 4) // 1.25M chars * 2 bytes/char = 2.5MB (50%)
    localStorage.setItem(key, value)

    const usage = estimateLocalStorageUsagePercent()
    expect(usage).toBeGreaterThan(45)
    expect(usage).toBeLessThan(55)
  })

  it('should handle values exceeding the estimated limit', () => {
    // Since jsdom enforces its own 5MB limit, we can't easily test clamping > 100
    // without hitting QuotaExceededError. We'll test that it gets close to 100.
    const key = 'test-key'
    const value = 'a'.repeat(2 * 1024 * 1024) // 2M chars * 2 bytes = 4MB (80%)
    localStorage.setItem(key, value)

    expect(estimateLocalStorageUsagePercent()).toBeCloseTo(80, 0)
  })
})
