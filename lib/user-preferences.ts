/**
 * Sistema de niveles de feedback que adapta la complejidad visual
 * según la experiencia del usuario
 */
export type FeedbackLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserPreferences {
  feedbackLevel: FeedbackLevel
  showTechnicalDetails: boolean
  enableCelebrations: boolean
  enableHaptics: boolean
  soundFeedbackEnabled: boolean
}

export const FEEDBACK_CONFIGS: Record<FeedbackLevel, {
  showCents: boolean
  centsTolerance: number
  showConfidence: boolean
  visualStyle: 'emoji' | 'technical' | 'hybrid'
  celebrationIntensity: 'subtle' | 'moderate' | 'enthusiastic'
}> = {
  beginner: {
    showCents: false,
    centsTolerance: 25,
    showConfidence: false,
    visualStyle: 'emoji',
    celebrationIntensity: 'enthusiastic'
  },
  intermediate: {
    showCents: true,
    centsTolerance: 15,
    showConfidence: false,
    visualStyle: 'hybrid',
    celebrationIntensity: 'moderate'
  },
  advanced: {
    showCents: true,
    centsTolerance: 10,
    showConfidence: true,
    visualStyle: 'technical',
    celebrationIntensity: 'subtle'
  }
}
