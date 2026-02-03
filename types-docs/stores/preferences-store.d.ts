import { UserPreferences, FeedbackLevel } from '@/lib/user-preferences';
interface PreferencesStore extends UserPreferences {
    schemaVersion: 1;
    setFeedbackLevel: (level: FeedbackLevel) => void;
    toggleTechnicalDetails: () => void;
    toggleCelebrations: () => void;
    toggleHaptics: () => void;
    toggleSoundFeedback: () => void;
    resetToDefaults: () => void;
}
export declare const usePreferencesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PreferencesStore>>;
export {};
