import type { Exercise } from '@/lib/domain/exercise';
interface ExercisePreviewModalProps {
    exercise: Exercise | undefined;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onStart: () => void;
}
export declare function ExercisePreviewModal({ exercise, isOpen, onOpenChange, onStart, }: ExercisePreviewModalProps): import("react/jsx-runtime").JSX.Element;
export {};
