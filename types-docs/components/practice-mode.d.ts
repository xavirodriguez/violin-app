/**
 * PracticeMode
 *
 * The main container component for the interactive practice session.
 */
import { Exercise } from '@/lib/domain/exercise';
/**
 * Custom hook to manage the local UI state for the practice view.
 */
export declare function usePracticeViewState(): {
    state: {
        preview: Exercise | undefined;
        view: "focused" | "full";
        isZen: boolean;
    };
    actions: {
        setPreview: import("react").Dispatch<import("react").SetStateAction<Exercise | undefined>>;
        setView: import("react").Dispatch<import("react").SetStateAction<"focused" | "full">>;
        setIsZen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    };
};
export declare function PracticeMode(): import("react/jsx-runtime").JSX.Element;
