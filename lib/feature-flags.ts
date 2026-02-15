/**
 * Feature Flags Management System
 *
 * This module provides a centralized way to manage experimental features
 * and conditional code execution based on environment variables.
 */

/**
 * Categories of feature flags to define their maturity and lifecycle stage.
 *
 * @public
 */
export type FeatureFlagType =
  | 'EXPERIMENTAL'
  | 'BETA'
  | 'STABLE'
  | 'UNSTABLE'
  | 'INTEGRATION'
  | 'PERFORMANCE'
  | 'UI_UX'
  | 'DEPRECATED'

/**
 * Detailed metadata for a feature flag.
 *
 * @remarks
 * This metadata is used for automated audits and risk assessment.
 *
 * @public
 */
export interface FeatureFlagMetadata {
  /** Technical name of the flag (usually uppercase with underscores). */
  name: string
  /** Human-readable key for use in configuration files or UIs. */
  key: string
  /** The maturity type of the feature. */
  type: FeatureFlagType
  /** Purpose and impact of the feature. */
  description: string
  /** Fallback value if the environment variable is not defined. */
  defaultValue: boolean
  /** List of files primarily affected by this feature. */
  affectedFiles?: string[]
  /** Perceived impact on system stability. */
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  /** Plan for disabling the feature if it causes production issues. */
  rollbackStrategy?: string
  /** Other flags that must be enabled for this one to function. */
  dependencies?: string[]
}

export const FEATURE_FLAGS_METADATA = {
  FEATURE_AUDIO_WEB_WORKER: {
    name: 'FEATURE_AUDIO_WEB_WORKER',
    key: 'audioWebWorker',
    type: 'PERFORMANCE',
    description: 'Offload audio processing to a Web Worker for 60Hz+ analysis.',
    defaultValue: false,
    riskLevel: 'HIGH',
    affectedFiles: [
      'lib/pitch-detector.ts',
      'lib/note-stream.ts',
      'public/workers/audio-processor.worker.ts'
    ],
    rollbackStrategy: 'Fallback to main-thread audio processing.'
  },
  FEATURE_UI_INTONATION_HEATMAPS: {
    name: 'FEATURE_UI_INTONATION_HEATMAPS',
    key: 'uiIntonationHeatmaps',
    type: 'STABLE',
    description: 'Show intonation heatmaps in the analytics dashboard.',
    defaultValue: true,
    riskLevel: 'LOW',
    affectedFiles: ['components/analytics-dashboard.tsx'],
    rollbackStrategy: 'Disable the heatmap visualization.'
  },
  FEATURE_SOCIAL_PRACTICE_ROOMS: {
    name: 'FEATURE_SOCIAL_PRACTICE_ROOMS',
    key: 'socialPracticeRooms',
    type: 'EXPERIMENTAL',
    description: 'Real-time synchronization for group practice or teacher-led sessions.',
    defaultValue: false,
    riskLevel: 'HIGH',
    affectedFiles: [],
    rollbackStrategy: 'Disable real-time synchronization features.'
  },
} as const satisfies Record<string, FeatureFlagMetadata>

/**
 * Type representing all valid feature flag names.
 */
export type FeatureFlagName = keyof typeof FEATURE_FLAGS_METADATA

/**
 * Service for querying and validating feature flags across the application.
 *
 * @remarks
 * This manager provides a unified API for both server-side and client-side
 * feature gating. It handles the complexity of Next.js environment variable
 * prefixing (`NEXT_PUBLIC_`).
 *
 * @internal
 */
class FeatureFlagsManager {
  /**
   * Internal mapping to ensure Next.js bundler replaces environment variables.
   *
   * @remarks
   * Due to how Next.js static analysis works, environment variables must be
   * accessed using their full literal name (e.g. `process.env.FLAG`).
   *
   * @internal
   */
  private getClientValue(flagName: string): string | undefined {
    switch (flagName) {
      case 'FEATURE_AUDIO_WEB_WORKER':
        return process.env.FEATURE_AUDIO_WEB_WORKER ?? process.env.NEXT_PUBLIC_FEATURE_AUDIO_WEB_WORKER
      case 'FEATURE_UI_INTONATION_HEATMAPS':
        return process.env.FEATURE_UI_INTONATION_HEATMAPS ?? process.env.NEXT_PUBLIC_FEATURE_UI_INTONATION_HEATMAPS
      case 'FEATURE_SOCIAL_PRACTICE_ROOMS':
        return process.env.FEATURE_SOCIAL_PRACTICE_ROOMS ?? process.env.NEXT_PUBLIC_FEATURE_SOCIAL_PRACTICE_ROOMS
      default:
        return undefined
    }
  }

  /**
   * Checks if a feature flag is enabled.
   *
   * @remarks
   * In Next.js, to access environment variables on the client,
   * they must be prefixed with NEXT_PUBLIC_. This manager checks both
   * the provided name and its NEXT_PUBLIC_ prefixed version.
   */
  isEnabled(flagName: FeatureFlagName): boolean {
    const metadata = FEATURE_FLAGS_METADATA[flagName]
    if (!metadata) {
      console.warn(`Feature flag "${flagName}" is not defined in FEATURE_FLAGS_METADATA.`)
      return false
    }

    // Check direct env var (works on server)
    // or prefixed version (works on client if explicitly mapped)
    const val =
      process.env[flagName] ??
      this.getClientValue(flagName) ??
      process.env[`NEXT_PUBLIC_${flagName}`]

    if (val === undefined) {
      return metadata.defaultValue
    }

    return val === 'true'
  }

  get<T = unknown>(flagName: FeatureFlagName, defaultValue?: T): T | string | boolean | undefined {
    const val =
      process.env[flagName] ??
      this.getClientValue(flagName) ??
      process.env[`NEXT_PUBLIC_${flagName}`]
    if (val !== undefined) return val

    const metadata = FEATURE_FLAGS_METADATA[flagName]
    if (!metadata) {
      return defaultValue
    }
    return defaultValue !== undefined
      ? defaultValue
      : (metadata.defaultValue as unknown as T)
  }

  getAll(): Record<string, boolean> {
    const allFlags: Record<string, boolean> = {}
    for (const flagName in FEATURE_FLAGS_METADATA) {
      const name = flagName as FeatureFlagName
      allFlags[name] = this.isEnabled(name)
    }
    return allFlags
  }

  validateFlags(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check dependencies
    for (const flagName in FEATURE_FLAGS_METADATA) {
      const name = flagName as FeatureFlagName
      const metadata = FEATURE_FLAGS_METADATA[name] as FeatureFlagMetadata

      if (this.isEnabled(name) && metadata.dependencies) {
        for (const dep of metadata.dependencies) {
          if (!this.isEnabled(dep as FeatureFlagName)) {
            errors.push(`Flag "${name}" is enabled but its dependency "${dep}" is disabled.`)
          }
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }
}

export const featureFlags = new FeatureFlagsManager()

/**
 * Hook to use a feature flag in a React component.
 */
export function useFeatureFlag(flagName: FeatureFlagName): boolean {
  // In a real app, this might subscribe to a store or use useSyncExternalStore
  // for real-time updates, but for now we'll just return the value.
  return featureFlags.isEnabled(flagName)
}

/**
 * Hook to use multiple feature flags in a React component.
 */
export function useFeatureFlags(flagNames: FeatureFlagName[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  flagNames.forEach((name) => {
    result[name] = featureFlags.isEnabled(name)
  })
  return result
}
