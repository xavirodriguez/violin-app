import type { Exercise } from '@/lib/domain/exercise';
interface ExerciseLibraryProps {
    selectedId?: string;
    onSelect: (exercise: Exercise) => void;
    disabled: boolean;
}
/**
 * Library component for browsing and selecting exercises.
 */
export declare function ExerciseLibrary(props: ExerciseLibraryProps): import("react/jsx-runtime").JSX.Element;
export {};
