/**
 * Utils
 * General purpose utility functions for the application.
 */
import { type ClassValue } from 'clsx';
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
export declare function cn(...inputs: ClassValue[]): string;
