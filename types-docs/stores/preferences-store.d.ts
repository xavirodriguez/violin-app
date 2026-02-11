import { UserPreferences, FeedbackLevel } from '@/lib/user-preferences';
/**
 * Interface for the Preferences Store, extending base {@link UserPreferences}.
 *
 * @public
 */
interface PreferencesStore extends UserPreferences {
    /** Persistence schema version. Used for migrations. */
    schemaVersion: 1;
    /**
     * Sets the pedagogical feedback level.
     *
     * @param level - The new feedback level (e.g., 'beginner', 'advanced').
     */
    setFeedbackLevel: (level: FeedbackLevel) => void;
    /** Toggles visibility of technical cents/hertz details in the UI. */
    toggleTechnicalDetails: () => void;
    /** Toggles celebratory UI effects (e.g., confetti) on success. */
    toggleCelebrations: () => void;
    /** Toggles haptic feedback (if supported by device). */
    toggleHaptics: () => void;
    /** Toggles audio-based correctness feedback. */
    toggleSoundFeedback: () => void;
    /** Resets all preferences to their default values. */
    resetToDefaults: () => void;
}
/**
 * Zustand store for managing persistent user preferences.
 *
 * @remarks
 * This store handles UI and pedagogical settings that customize the user experience.
 * It uses `validatedPersist` to ensure that data stored in `localStorage` remains
 * compliant with the `PreferencesStateSchema`.
 *
 * All changes are automatically tracked via the `analytics` service.
 *
 * @public
 */
export declare const usePreferencesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PreferencesStore>>;
export {};
