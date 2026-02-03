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
export declare const usePreferencesStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<PreferencesStore>, "setState" | "persist"> & {
    setState(partial: PreferencesStore | Partial<PreferencesStore> | ((state: PreferencesStore) => PreferencesStore | Partial<PreferencesStore>), replace?: false | undefined): unknown;
    setState(state: PreferencesStore | ((state: PreferencesStore) => PreferencesStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<PreferencesStore, PreferencesStore, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: PreferencesStore) => void) => () => void;
        onFinishHydration: (fn: (state: PreferencesStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<PreferencesStore, PreferencesStore, unknown>>;
    };
}>;
export {};
