import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserPreferences, FeedbackLevel } from '@/lib/user-preferences'
import { analytics } from '@/lib/analytics-tracker'

interface PreferencesStore extends UserPreferences {
  setFeedbackLevel: (level: FeedbackLevel) => void
  toggleTechnicalDetails: () => void
  toggleCelebrations: () => void
  toggleHaptics: () => void
  toggleSoundFeedback: () => void
  resetToDefaults: () => void
}

const DEFAULT_PREFERENCES: UserPreferences = {
  feedbackLevel: 'beginner',
  showTechnicalDetails: false,
  enableCelebrations: true,
  enableHaptics: true,
  soundFeedbackEnabled: false
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      setFeedbackLevel: (level) => {
        set({ feedbackLevel: level })
        analytics.track('feedback_level_changed', { level })
      },
      toggleTechnicalDetails: () => set((state) => ({
        showTechnicalDetails: !state.showTechnicalDetails
      })),
      toggleCelebrations: () => set((state) => ({
        enableCelebrations: !state.enableCelebrations
      })),
      toggleHaptics: () => set((state) => ({
        enableHaptics: !state.enableHaptics
      })),
      toggleSoundFeedback: () => set((state) => ({
        soundFeedbackEnabled: !state.soundFeedbackEnabled
      })),
      resetToDefaults: () => set(DEFAULT_PREFERENCES)
    }),
    {
      name: 'violin-mentor-preferences'
    }
  )
)
