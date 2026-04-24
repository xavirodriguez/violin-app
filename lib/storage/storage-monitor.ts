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
  const isServer = typeof window === 'undefined'
  if (isServer) return 0

  const limit = 5 * 1024 * 1024
  const bytes = calculateTotalBytes()
  const result = formatUsagePercent(bytes, limit)

  return result
}

function calculateTotalBytes(): number {
  let totalBytes = 0

  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const value = localStorage.getItem(key)
      const valueLength = value ? value.length : 0
      totalBytes += (key.length + valueLength) * 2
    }
  }

  return totalBytes
}

function formatUsagePercent(bytes: number, limit: number): number {
  const percentage = (bytes / limit) * 100
  const result = Math.min(100, Math.max(0, percentage))

  return result
}
