/**
 * Estimates the approximate usage percentage of localStorage.
 *
 * @returns A number from 0 to 100 representing the estimated usage percentage.
 *
 * @remarks
 * localStorage has a typical limit of ~5 MB across browsers.
 * This function iterates over all keys and sums the byte lengths of
 * keys and values (using UTF-16 encoding, 2 bytes per character).
 * The result is an approximation since browser limits vary.
 */
export function estimateLocalStorageUsagePercent(): number {
  const ESTIMATED_LIMIT_BYTES = 5 * 1024 * 1024 // 5 MB

  let totalBytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key === null) continue
    const value = localStorage.getItem(key) ?? ''
    // Each character in JS string is 2 bytes (UTF-16)
    totalBytes += (key.length + value.length) * 2
  }

  const percent = (totalBytes / ESTIMATED_LIMIT_BYTES) * 100
  return Math.min(100, Math.round(percent * 10) / 10)
}
