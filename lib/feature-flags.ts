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
}

export const FEATURE_FLAGS_METADATA: Record<string, FeatureFlagMetadata> = {
  FEATURE_UI_VIOLIN_FINGERBOARD: {
    name: 'FEATURE_UI_VIOLIN_FINGERBOARD',
    key: 'uiViolinFingerboard',
    type: 'UI_UX',
    description: 'Toggle the violin fingerboard visualization in practice mode.',
    defaultValue: true,
    riskLevel: 'LOW',
    affectedFiles: ['components/practice-mode.tsx'],
    rollbackStrategy: 'Disable the flag to hide the fingerboard visualization.'
  },
  FEATURE_ANALYTICS_DASHBOARD: {
    name: 'FEATURE_ANALYTICS_DASHBOARD',
    key: 'analyticsDashboard',
    type: 'BETA',
    description: 'Toggle the progress analytics dashboard.',
    defaultValue: false,
    riskLevel: 'LOW',
    affectedFiles: ['components/analytics-dashboard.tsx'],
    rollbackStrategy: 'Disable the flag to hide the analytics dashboard.'
  },
  FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY: {
    name: 'FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY',
    key: 'practiceAdaptiveDifficulty',
    type: 'EXPERIMENTAL',
    description: 'Enable adaptive difficulty based on performance metrics.',
    defaultValue: false,
    riskLevel: 'MEDIUM',
    affectedFiles: ['lib/practice-core.ts'],
    rollbackStrategy: 'Revert to fixed difficulty levels.'
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
  FEATURE_PRACTICE_ASSISTANT: {
    name: 'FEATURE_PRACTICE_ASSISTANT',
    key: 'practiceAssistant',
    type: 'BETA',
    description: 'Enable the contextual practice assistant (cmdk).',
    defaultValue: false,
    riskLevel: 'MEDIUM',
    affectedFiles: ['app/layout.tsx'],
    rollbackStrategy: 'Disable the practice assistant component.'
  },
  FEATURE_TECHNICAL_FEEDBACK: {
    name: 'FEATURE_TECHNICAL_FEEDBACK',
    key: 'technicalFeedback',
    type: 'UI_UX',
    description: 'Show advanced technical observations and pedagogical tips.',
    defaultValue: true,
    riskLevel: 'LOW',
    affectedFiles: ['components/practice-feedback.tsx'],
    rollbackStrategy: 'Disable advanced observations display.'
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
    defaultValue: false,
    riskLevel: 'LOW',
    affectedFiles: [],
    rollbackStrategy: 'Disable accuracy telemetry tracking.'
  }
}

class FeatureFlagsManager {
  /**
   * Internal mapping to ensure Next.js bundler replaces environment variables.
   * @internal
   */
  private getClientValue(flagName: string): string | undefined {
    switch (flagName) {
      case 'FEATURE_UI_VIOLIN_FINGERBOARD':
        return process.env.FEATURE_UI_VIOLIN_FINGERBOARD ?? process.env.NEXT_PUBLIC_FEATURE_UI_VIOLIN_FINGERBOARD
      case 'FEATURE_ANALYTICS_DASHBOARD':
        return process.env.FEATURE_ANALYTICS_DASHBOARD ?? process.env.NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD
      case 'FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY':
        return process.env.FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY ?? process.env.NEXT_PUBLIC_FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY
      case 'FEATURE_AUDIO_WEB_WORKER':
        return process.env.FEATURE_AUDIO_WEB_WORKER ?? process.env.NEXT_PUBLIC_FEATURE_AUDIO_WEB_WORKER
      case 'FEATURE_UI_INTONATION_HEATMAPS':
        return process.env.FEATURE_UI_INTONATION_HEATMAPS ?? process.env.NEXT_PUBLIC_FEATURE_UI_INTONATION_HEATMAPS
      case 'FEATURE_PRACTICE_ASSISTANT':
        return process.env.FEATURE_PRACTICE_ASSISTANT ?? process.env.NEXT_PUBLIC_FEATURE_PRACTICE_ASSISTANT
      case 'FEATURE_TECHNICAL_FEEDBACK':
        return process.env.FEATURE_TECHNICAL_FEEDBACK ?? process.env.NEXT_PUBLIC_FEATURE_TECHNICAL_FEEDBACK
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
  isEnabled(flagName: string): boolean {
    const metadata = FEATURE_FLAGS_METADATA[flagName]
    if (!metadata) {
      console.warn(`Feature flag "${flagName}" is not defined in FEATURE_FLAGS_METADATA.`)
      return false
    }

    // Check direct env var (works on server)
    // or prefixed version (works on client if explicitly mapped)
    const val = process.env[flagName] ?? this.getClientValue(flagName) ?? process.env[`NEXT_PUBLIC_${flagName}`]

    if (val === undefined) {
      return metadata.defaultValue
    }

    return val === 'true'
  }

  get<T = unknown>(flagName: string, defaultValue?: T): T | string | boolean | undefined {
    const val = process.env[flagName] ?? this.getClientValue(flagName) ?? process.env[`NEXT_PUBLIC_${flagName}`]
    if (val !== undefined) return val

    const metadata = FEATURE_FLAGS_METADATA[flagName]
    return defaultValue !== undefined ? defaultValue : (metadata ? metadata.defaultValue as unknown as T : undefined)
  }

  getAll(): Record<string, boolean> {
    const allFlags: Record<string, boolean> = {}
    for (const flagName in FEATURE_FLAGS_METADATA) {
      allFlags[flagName] = this.isEnabled(flagName)
    }
    return allFlags
  }

  validateFlags(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    // Add validation logic if needed
    return { valid: errors.length === 0, errors }
  }
}

export const featureFlags = new FeatureFlagsManager()

/**
 * Hook to use a feature flag in a React component.
 */
export function useFeatureFlag(flagName: string): boolean {
  // In a real app, this might subscribe to a store or use useSyncExternalStore
  // for real-time updates, but for now we'll just return the value.
  return featureFlags.isEnabled(flagName)
}

/**
 * Hook to use multiple feature flags in a React component.
 */
export function useFeatureFlags(flagNames: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  flagNames.forEach(name => {
    result[name] = featureFlags.isEnabled(name)
  })
  return result
}
