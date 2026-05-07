/**
 * Custom hook to manage the state and logic of the Exercise Library.
 */
export declare function useExerciseLibrary(): {
    activeTab: string;
    setActiveTab: import("react").Dispatch<import("react").SetStateAction<string>>;
    difficultyFilter: string;
    setDifficultyFilter: import("react").Dispatch<import("react").SetStateAction<string>>;
    filtered: import("../lib/domain/exercise").Exercise[];
    recommended: import("@/lib/exercise-recommender").ExerciseRecommendation | undefined;
    exerciseStats: Record<string, import("../lib/domain/practice").ExerciseStats>;
};
