/**
 * Feature Flags Management System
 *
 * This module provides a centralized way to manage experimental features
 * and conditional code execution based on environment variables.
 */
/**
 * Categories of feature flags to define their maturity and lifecycle stage.
 */
export type FeatureFlagType = 'EXPERIMENTAL' | 'BETA' | 'STABLE' | 'UNSTABLE' | 'INTEGRATION' | 'PERFORMANCE' | 'UI_UX' | 'DEPRECATED';
/**
 * Detailed metadata for a feature flag.
 */
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
    readonly FEATURE_AUDIO_WEB_WORKER: {
        readonly name: "FEATURE_AUDIO_WEB_WORKER";
        readonly key: "audioWebWorker";
        readonly type: "PERFORMANCE";
        readonly description: "Offload audio processing to a Web Worker for 60Hz+ analysis.";
        readonly defaultValue: false;
        readonly riskLevel: "HIGH";
        readonly affectedFiles: ["lib/pitch-detector.ts", "lib/note-stream.ts", "public/workers/audio-processor.worker.ts"];
        readonly rollbackStrategy: "Fallback to main-thread audio processing.";
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
        readonly description: "Collect anonymous pitch detection accuracy data for optimization.";
        readonly defaultValue: true;
        readonly riskLevel: "LOW";
        readonly affectedFiles: ["lib/practice/session-runner.ts"];
        readonly rollbackStrategy: "Disable telemetry logging.";
    };
};
export type FeatureFlagName = keyof typeof FEATURE_FLAGS_METADATA;
/**
 * Service for querying and validating feature flags.
 * Exported to support dynamic testing and isolation.
 */
export declare class FeatureFlagsManager {
    /**
     * Resolves the value of a feature flag from environment variables.
     * Uses manual switch-case to ensure static inlining by Next.js compiler.
     */
    private getClientValue;
    private getFeatureMapping;
    private lookupFlagValue;
    isEnabled(flagName: FeatureFlagName): boolean;
    get<T = unknown>(flagName: FeatureFlagName, defaultValue?: T): T | string | boolean | undefined;
    getAll(): Record<string, boolean>;
    validateFlags(): {
        valid: boolean;
        errors: string[];
    };
    private checkDependencies;
}
export declare const featureFlags: FeatureFlagsManager;
export declare function useFeatureFlag(flagName: FeatureFlagName): boolean;
export declare function useFeatureFlags(flagNames: FeatureFlagName[]): Record<string, boolean>;
