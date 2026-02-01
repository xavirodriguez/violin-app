/**
 * Sistema de niveles de feedback que adapta la complejidad visual
 * según la experiencia del usuario
 */
export type FeedbackLevel = 'beginner' | 'intermediate' | 'advanced';
export interface UserPreferences {
    feedbackLevel: FeedbackLevel;
    showTechnicalDetails: boolean;
    enableCelebrations: boolean;
    enableHaptics: boolean;
    soundFeedbackEnabled: boolean;
}
export declare const FEEDBACK_CONFIGS: Record<FeedbackLevel, {
    showCents: boolean;
    centsTolerance: number;
    showConfidence: boolean;
    visualStyle: 'emoji' | 'technical' | 'hybrid';
    celebrationIntensity: 'subtle' | 'moderate' | 'enthusiastic';
}>;
