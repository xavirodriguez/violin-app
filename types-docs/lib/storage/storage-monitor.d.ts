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
export declare function estimateLocalStorageUsagePercent(): number;
