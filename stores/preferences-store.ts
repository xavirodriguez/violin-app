import { create } from 'zustand'
import { UserPreferences, FeedbackLevel } from '@/lib/user-preferences'
import { analytics } from '@/lib/analytics-tracker'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { createMigrator } from '@/lib/persistence/migrator'
import { PreferencesStateSchema } from '@/lib/schemas/persistence.schema'

/**
 * Interface for the Preferences Store, extending base {@link UserPreferences}.
 *
 * @public
 */
interface PreferencesStore extends UserPreferences {
  /** Persistence schema version. */
  schemaVersion: 1

  /**
   * Sets the pedagogical feedback level.
   *
   * @param level - The new feedback level.
   */
  setFeedbackLevel: (level: FeedbackLevel) => void

  /** Toggles visibility of technical cents/hertz details in the UI. */
  toggleTechnicalDetails: () => void

  /** Toggles celebratory UI effects (e.g., confetti) on success. */
  toggleCelebrations: () => void

  /** Toggles haptic feedback (if supported by device). */
  toggleHaptics: () => void

  /** Toggles audio-based correctness feedback. */
  toggleSoundFeedback: () => void

  /** Resets all preferences to their default values. */
  resetToDefaults: () => void
}

/**
 * Initial/Default preference values.
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  feedbackLevel: 'beginner',
  showTechnicalDetails: false,
  enableCelebrations: true,
  enableHaptics: true,
  soundFeedbackEnabled: false
}

/**
 * Zustand store for managing persistent user preferences.
 *
 * @remarks
 * This store handles UI and pedagogical settings that customize the user experience.
 * Settings are persisted across sessions and validated against `PreferencesStateSchema`.
 *
 * @public
 */
export const usePreferencesStore = create<PreferencesStore>()(
  validatedPersist(
    PreferencesStateSchema as any,
    (set) => ({
      schemaVersion: 1,
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
      name: 'violin-mentor-preferences',
      version: 1,
      migrate: createMigrator({
        1: (state: any) => ({
          ...state,
          schemaVersion: 1
        })
      })
    }
  )
)
