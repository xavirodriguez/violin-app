interface PracticeSettingsProps {
    autoStartEnabled: boolean;
    onAutoStartChange: (enabled: boolean) => void;
}
/**
 * UI component for practice-specific settings like auto-start.
 */
export declare function PracticeSettings({ autoStartEnabled, onAutoStartChange }: PracticeSettingsProps): import("react/jsx-runtime").JSX.Element;
export {};
