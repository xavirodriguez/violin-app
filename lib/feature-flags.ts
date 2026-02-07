/**
 * Feature Flags Management System
 *
 * This module provides a centralized way to manage experimental features
 * and conditional code execution based on environment variables.
 */

export type FeatureFlagType =
  | 'EXPERIMENTAL'
  | 'BETA'
  | 'UNSTABLE'
  | 'INTEGRATION'
  | 'PERFORMANCE'
  | 'UI_UX'
  | 'DEPRECATED'

export interface FeatureFlagMetadata {
  name: string
  key: string
  type: FeatureFlagType
  description: string
  defaultValue: boolean
  affectedFiles?: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  rollbackStrategy?: string
  dependencies?: string[]
}

export const FEATURE_FLAGS_METADATA = {
  FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY: {
    name: 'FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY',
    key: 'practiceAdaptiveDifficulty',
    type: 'BETA',
    description: 'Dynamic adjustment of cents tolerance and required hold time based on perfect note streaks.',
    defaultValue: false,
    riskLevel: 'MEDIUM',
    affectedFiles: ['lib/practice-engine/engine.ts'],
    rollbackStrategy: 'Revert to fixed difficulty levels.',
    dependencies: ['FEATURE_TELEMETRY_ACCURACY']
  },
  FEATURE_AUDIO_WEB_WORKER: {
    name: 'FEATURE_AUDIO_WEB_WORKER',
    key: 'audioWebWorker',
    type: 'PERFORMANCE',
    description: 'Offload audio processing to a Web Worker.',
    defaultValue: false,
    riskLevel: 'HIGH',
    affectedFiles: ['lib/pitch-detector.ts', 'lib/note-stream.ts'],
    rollbackStrategy: 'Fallback to main-thread audio processing.'
  },
  FEATURE_UI_INTONATION_HEATMAPS: {
    name: 'FEATURE_UI_INTONATION_HEATMAPS',
    key: 'uiIntonationHeatmaps',
    type: 'EXPERIMENTAL',
    description: 'Show intonation heatmaps in the analytics dashboard.',
    defaultValue: false,
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
  FEATURE_TELEMETRY_ACCURACY: {
    name: 'FEATURE_TELEMETRY_ACCURACY',
    key: 'telemetryAccuracy',
    type: 'INTEGRATION',
    description: 'Track detection confidence via Vercel Analytics to identify environment issues.',
    defaultValue: true,
    riskLevel: 'LOW',
    affectedFiles: [],
    rollbackStrategy: 'Disable accuracy telemetry tracking.'
  }
} as const satisfies Record<string, FeatureFlagMetadata>

/**
 * Type representing all valid feature flag names.
 */
export type FeatureFlagName = keyof typeof FEATURE_FLAGS_METADATA

class FeatureFlagsManager {
  /**
   * Internal mapping to ensure Next.js bundler replaces environment variables.
   * @internal
   */
  private getClientValue(flagName: string): string | undefined {
    switch (flagName) {
      case 'FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY':
        return process.env.FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY ?? process.env.NEXT_PUBLIC_FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY
      case 'FEATURE_AUDIO_WEB_WORKER':
        return process.env.FEATURE_AUDIO_WEB_WORKER ?? process.env.NEXT_PUBLIC_FEATURE_AUDIO_WEB_WORKER
      case 'FEATURE_UI_INTONATION_HEATMAPS':
        return process.env.FEATURE_UI_INTONATION_HEATMAPS ?? process.env.NEXT_PUBLIC_FEATURE_UI_INTONATION_HEATMAPS
      case 'FEATURE_SOCIAL_PRACTICE_ROOMS':
        return process.env.FEATURE_SOCIAL_PRACTICE_ROOMS ?? process.env.NEXT_PUBLIC_FEATURE_SOCIAL_PRACTICE_ROOMS
      case 'FEATURE_TELEMETRY_ACCURACY':
        return process.env.FEATURE_TELEMETRY_ACCURACY ?? process.env.NEXT_PUBLIC_FEATURE_TELEMETRY_ACCURACY
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
