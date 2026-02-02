/**
 * Feature Flags Management System
 *
 * This module provides a centralized way to manage experimental features
 * and conditional code execution based on environment variables.
 */
export type FeatureFlagType = 'EXPERIMENTAL' | 'BETA' | 'UNSTABLE' | 'INTEGRATION' | 'PERFORMANCE' | 'UI_UX' | 'DEPRECATED';
export interface FeatureFlagMetadata {
    name: string;
    key: string;
    type: FeatureFlagType;
    description: string;
    defaultValue: boolean;
    affectedFiles?: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    rollbackStrategy?: string;
    dependencies?: string[];
}
export declare const FEATURE_FLAGS_METADATA: {
    readonly FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY: {
        readonly name: "FEATURE_PRACTICE_ADAPTIVE_DIFFICULTY";
        readonly key: "practiceAdaptiveDifficulty";
        readonly type: "EXPERIMENTAL";
        readonly description: "Enable adaptive difficulty based on performance metrics.";
        readonly defaultValue: false;
        readonly riskLevel: "MEDIUM";
        readonly affectedFiles: ["lib/practice-core.ts"];
        readonly rollbackStrategy: "Revert to fixed difficulty levels.";
        readonly dependencies: ["FEATURE_TELEMETRY_ACCURACY"];
    };
    readonly FEATURE_AUDIO_WEB_WORKER: {
        readonly name: "FEATURE_AUDIO_WEB_WORKER";
        readonly key: "audioWebWorker";
        readonly type: "PERFORMANCE";
        readonly description: "Offload audio processing to a Web Worker.";
        readonly defaultValue: false;
        readonly riskLevel: "HIGH";
        readonly affectedFiles: ["lib/pitch-detector.ts", "lib/note-stream.ts"];
        readonly rollbackStrategy: "Fallback to main-thread audio processing.";
    };
    readonly FEATURE_UI_INTONATION_HEATMAPS: {
        readonly name: "FEATURE_UI_INTONATION_HEATMAPS";
        readonly key: "uiIntonationHeatmaps";
        readonly type: "EXPERIMENTAL";
        readonly description: "Show intonation heatmaps in the analytics dashboard.";
        readonly defaultValue: false;
        readonly riskLevel: "LOW";
        readonly affectedFiles: ["components/analytics-dashboard.tsx"];
        readonly rollbackStrategy: "Disable the heatmap visualization.";
    };
    readonly FEATURE_SOCIAL_PRACTICE_ROOMS: {
        readonly name: "FEATURE_SOCIAL_PRACTICE_ROOMS";
        readonly key: "socialPracticeRooms";
        readonly type: "EXPERIMENTAL";
        readonly description: "Real-time synchronization for group practice or teacher-led sessions.";
        readonly defaultValue: false;
        readonly riskLevel: "HIGH";
        readonly affectedFiles: [];
        readonly rollbackStrategy: "Disable real-time synchronization features.";
    };
    readonly FEATURE_TELEMETRY_ACCURACY: {
        readonly name: "FEATURE_TELEMETRY_ACCURACY";
        readonly key: "telemetryAccuracy";
        readonly type: "INTEGRATION";
        readonly description: "Track detection confidence via Vercel Analytics to identify environment issues.";
        readonly defaultValue: false;
        readonly riskLevel: "LOW";
        readonly affectedFiles: [];
        readonly rollbackStrategy: "Disable accuracy telemetry tracking.";
    };
    readonly FEATURE_PRACTICE_ZEN_MODE: {
        readonly name: "FEATURE_PRACTICE_ZEN_MODE";
        readonly key: "practiceZenMode";
        readonly type: "EXPERIMENTAL";
        readonly description: "Enable Zen Mode to simplify the interface during practice.";
        readonly defaultValue: true;
        readonly riskLevel: "LOW";
        readonly affectedFiles: ["components/practice-mode.tsx"];
        readonly rollbackStrategy: "Disable Zen Mode functionality.";
    };
    readonly FEATURE_PRACTICE_AUTO_START: {
        readonly name: "FEATURE_PRACTICE_AUTO_START";
        readonly key: "practiceAutoStart";
        readonly type: "BETA";
        readonly description: "Enable automatic start of audio detection when an exercise is loaded.";
        readonly defaultValue: true;
        readonly riskLevel: "LOW";
        readonly affectedFiles: ["stores/practice-store.ts", "components/practice-mode.tsx"];
        readonly rollbackStrategy: "Disable auto-start and require manual start.";
    };
    readonly FEATURE_PRACTICE_EXERCISE_RECOMMENDER: {
        readonly name: "FEATURE_PRACTICE_EXERCISE_RECOMMENDER";
        readonly key: "practiceExerciseRecommender";
        readonly type: "BETA";
        readonly description: "Enable the exercise recommendation system based on user performance.";
        readonly defaultValue: true;
        readonly riskLevel: "MEDIUM";
        readonly affectedFiles: ["lib/exercise-recommender.ts", "components/practice-mode.tsx"];
        readonly rollbackStrategy: "Disable recommendations and show all exercises.";
    };
    readonly FEATURE_PRACTICE_ACHIEVEMENT_SYSTEM: {
        readonly name: "FEATURE_PRACTICE_ACHIEVEMENT_SYSTEM";
        readonly key: "practiceAchievementSystem";
        readonly type: "BETA";
        readonly description: "Enable the gamified achievement system.";
        readonly defaultValue: true;
        readonly riskLevel: "MEDIUM";
        readonly affectedFiles: ["lib/achievements/", "stores/analytics-store.ts"];
        readonly rollbackStrategy: "Disable achievement tracking and notifications.";
    };
};
/**
 * Type representing all valid feature flag names.
 */
export type FeatureFlagName = keyof typeof FEATURE_FLAGS_METADATA;
declare class FeatureFlagsManager {
    /**
     * Internal mapping to ensure Next.js bundler replaces environment variables.
     * @internal
     */
    private getClientValue;
    /**
     * Checks if a feature flag is enabled.
     *
     * @remarks
     * In Next.js, to access environment variables on the client,
     * they must be prefixed with NEXT_PUBLIC_. This manager checks both
     * the provided name and its NEXT_PUBLIC_ prefixed version.
     */
    isEnabled(flagName: FeatureFlagName): boolean;
    get<T = unknown>(flagName: FeatureFlagName, defaultValue?: T): T | string | boolean | undefined;
    getAll(): Record<string, boolean>;
    validateFlags(): {
        valid: boolean;
        errors: string[];
    };
}
export declare const featureFlags: FeatureFlagsManager;
/**
 * Hook to use a feature flag in a React component.
 */
export declare function useFeatureFlag(flagName: FeatureFlagName): boolean;
/**
 * Hook to use multiple feature flags in a React component.
 */
export declare function useFeatureFlags(flagNames: FeatureFlagName[]): Record<string, boolean>;
export {};
