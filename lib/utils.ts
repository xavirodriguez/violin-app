/**
 * Utils
 * General purpose utility functions for the application.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple Tailwind CSS classes and resolves conflicts.
 *
 * @param inputs - A list of class names, arrays, or objects to be merged.
 * @returns A single string of merged class names.
 *
 * @remarks
 * This utility combines `clsx` for conditional logic and `tailwind-merge`
 * to ensure that the last conflicting Tailwind class wins.
 *
 * @example
 * ```ts
 * cn('px-2 py-1', isPrimary && 'bg-blue-500', className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
