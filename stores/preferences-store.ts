import { create } from 'zustand'
import { UserPreferences, FeedbackLevel } from '@/lib/user-preferences'
import { analytics } from '@/lib/analytics-tracker'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { createMigrator } from '@/lib/persistence/migrator'
import { PreferencesStateSchema } from '@/lib/schemas/persistence.schema'

/**
 * Interface for the Preferences Store, extending base {@link UserPreferences}.
 *
 * @remarks
 * This store manages the persistent configuration for the application's
 * behavior and UI.
 *
 * @public
 */
interface PreferencesStore extends UserPreferences {
  /**
   * Persistence schema version.
   *
   * @remarks
   * Used by the migrator to handle state structure changes across versions.
   */
  schemaVersion: 1

  /**
   * Sets the pedagogical feedback level.
   *
   * @remarks
   * This level affects how many observations and what kind of technical
   * details are shown to the user during practice.
   *
   * @param level - The new feedback level (e.g., 'beginner', 'advanced').
   */
  setFeedbackLevel: (level: FeedbackLevel) => void

  /**
   * Toggles visibility of technical cents/hertz details in the UI.
   *
   * @remarks
   * When disabled, the UI shows more abstract "In Tune" / "Sharp" feedback.
   */
  toggleTechnicalDetails: () => void

  /**
   * Toggles celebratory UI effects (e.g., confetti) on exercise completion.
   */
  toggleCelebrations: () => void

  /**
   * Toggles haptic feedback for mobile devices.
   */
  toggleHaptics: () => void

  /**
   * Toggles audio-based feedback cues (beeps/tones) for correctness.
   */
  toggleSoundFeedback: () => void

  /**
   * Resets all preferences to their initial factory default values.
   */
  resetToDefaults: () => void
}

/**
 * Initial/Default preference values for a new user session.
 *
 * @internal
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
 *
 * **Persistence Layer**:
 * It uses `validatedPersist` to ensure that data stored in `localStorage` remains
 * compliant with the `PreferencesStateSchema`. This prevents crashes due to corrupted
 * or outdated local storage data.
 *
 * **Telemetry**:
 * All critical preference changes are automatically tracked via the `analytics` service
 * to understand user engagement with different features.
 *
 * @example
 * ```ts
 * const { feedbackLevel, setFeedbackLevel } = usePreferencesStore();
 * ```
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
