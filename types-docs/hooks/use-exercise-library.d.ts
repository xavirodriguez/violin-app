/**
 * Custom hook to manage the state and logic of the Exercise Library.
 */
export declare function useExerciseLibrary(): {
    activeTab: string;
    setActiveTab: import("react").Dispatch<import("react").SetStateAction<string>>;
    difficultyFilter: string;
    setDifficultyFilter: import("react").Dispatch<import("react").SetStateAction<string>>;
    filtered: import("../lib/domain/musical-types").Exercise[];
    recommended: import("../lib/domain/musical-types").Exercise | undefined;
    exerciseStats: Record<string, import("@/stores/analytics-store").ExerciseStats>;
};
