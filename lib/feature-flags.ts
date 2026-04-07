/**
 * Feature Flags Management System
 *
 * This module provides a centralized way to manage experimental features
 * and conditional code execution based on environment variables.
 */

/**
 * Categories of feature flags to define their maturity and lifecycle stage.
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
 */
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
      'public/workers/audio-processor.worker.ts',
    ],
    rollbackStrategy: 'Fallback to main-thread audio processing.',
  },
  FEATURE_SOCIAL_PRACTICE_ROOMS: {
    name: 'FEATURE_SOCIAL_PRACTICE_ROOMS',
    key: 'socialPracticeRooms',
    type: 'EXPERIMENTAL',
    description: 'Real-time synchronization for group practice or teacher-led sessions.',
    defaultValue: false,
    riskLevel: 'HIGH',
    affectedFiles: [],
    rollbackStrategy: 'Disable real-time synchronization features.',
  },
  FEATURE_TELEMETRY_ACCURACY: {
    name: 'FEATURE_TELEMETRY_ACCURACY',
    key: 'telemetryAccuracy',
    type: 'INTEGRATION',
    description: 'Collect anonymous pitch detection accuracy data for optimization.',
    defaultValue: true,
    riskLevel: 'LOW',
    affectedFiles: ['lib/practice/session-runner.ts'],
    rollbackStrategy: 'Disable telemetry logging.',
  },
} as const satisfies Record<string, FeatureFlagMetadata>

export type FeatureFlagName = keyof typeof FEATURE_FLAGS_METADATA

/**
 * Service for querying and validating feature flags.
 * Exported to support dynamic testing and isolation.
 */
export class FeatureFlagsManager {
  /**
   * Resolves the value of a feature flag from environment variables.
   * Uses manual switch-case to ensure static inlining by Next.js compiler.
   */
  private getClientValue(flagName: string): string | undefined {
    const mapping = this.getFeatureMapping()
    const mappedValue = mapping[flagName]
    const result = mappedValue !== undefined ? mappedValue : this.lookupFlagValue(flagName)

    return result
  }

  private getFeatureMapping(): Record<string, string | undefined> {
    return {
      FEATURE_AUDIO_WEB_WORKER:
        process.env.FEATURE_AUDIO_WEB_WORKER ?? process.env.NEXT_PUBLIC_FEATURE_AUDIO_WEB_WORKER,
      FEATURE_SOCIAL_PRACTICE_ROOMS:
        process.env.FEATURE_SOCIAL_PRACTICE_ROOMS ??
        process.env.NEXT_PUBLIC_FEATURE_SOCIAL_PRACTICE_ROOMS,
      FEATURE_TELEMETRY_ACCURACY:
        process.env.FEATURE_TELEMETRY_ACCURACY ?? process.env.NEXT_PUBLIC_FEATURE_TELEMETRY_ACCURACY,
    }
  }

  private lookupFlagValue(flagName: string): string | undefined {
    const direct = process.env[flagName]
    const publicFlag = process.env[`NEXT_PUBLIC_${flagName}`]
    const result = direct ?? publicFlag

    return result
  }

  isEnabled(flagName: FeatureFlagName): boolean {
    const metadata = FEATURE_FLAGS_METADATA[flagName]
    if (!metadata) {
      console.warn(`Feature flag "${flagName}" is not defined in FEATURE_FLAGS_METADATA.`)
      return false
    }

    const val = this.getClientValue(flagName)
    const result = val === undefined ? metadata.defaultValue : val === 'true'

    return result
  }

  get<T = unknown>(flagName: FeatureFlagName, defaultValue?: T): T | string | boolean | undefined {
    const val = this.getClientValue(flagName)
    if (val !== undefined) return val

    const metadata = FEATURE_FLAGS_METADATA[flagName]
    if (!metadata) return defaultValue

    const result = defaultValue !== undefined ? defaultValue : (metadata.defaultValue as unknown as T)
    return result
  }

  getAll(): Record<string, boolean> {
    const allFlags: Record<string, boolean> = {}
    const flagNames = Object.keys(FEATURE_FLAGS_METADATA) as FeatureFlagName[]

    for (const name of flagNames) {
      allFlags[name] = this.isEnabled(name)
    }

    return allFlags
  }

  validateFlags(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const flagNames = Object.keys(FEATURE_FLAGS_METADATA) as FeatureFlagName[]

    for (const name of flagNames) {
      const metadata = FEATURE_FLAGS_METADATA[name]
      this.checkDependencies(name, metadata, errors)
    }

    return { valid: errors.length === 0, errors }
  }

  private checkDependencies(
    name: FeatureFlagName,
    metadata: FeatureFlagMetadata,
    errors: string[],
  ): void {
    const isEnabled = this.isEnabled(name)
    const dependencies = metadata.dependencies

    if (isEnabled && dependencies) {
      dependencies.forEach((dep) => {
        if (!this.isEnabled(dep as FeatureFlagName)) {
          errors.push(`Flag "${name}" is enabled but dependency "${dep}" is disabled.`)
        }
      })
    }
  }
}

export const featureFlags = new FeatureFlagsManager()

export function useFeatureFlag(flagName: FeatureFlagName): boolean {
  return featureFlags.isEnabled(flagName)
}

export function useFeatureFlags(flagNames: FeatureFlagName[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}

  flagNames.forEach((name) => {
    result[name] = featureFlags.isEnabled(name)
  })

  return result
}
