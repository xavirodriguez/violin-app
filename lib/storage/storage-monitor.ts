/**
 * Utility to monitor localStorage usage.
 */

/**
 * Estimates the percentage of localStorage being used.
 *
 * @remarks
 * Most browsers have a limit of ~5MB per origin.
 *
 * @returns Usage percentage (0-100).
 */
export function estimateLocalStorageUsagePercent(): number {
  if (typeof window === 'undefined') return 0

  const ESTIMATED_LIMIT = 5 * 1024 * 1024 // 5MB
  let totalBytes = 0

  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const value = localStorage.getItem(key)
      if (value) {
        // Simple byte estimation for UTF-16
        totalBytes += (key.length + value.length) * 2
      }
    }
  }

  const percentage = (totalBytes / ESTIMATED_LIMIT) * 100
  return Math.min(100, Math.max(0, percentage))
}
