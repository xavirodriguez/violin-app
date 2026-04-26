import type { Exercise } from '@/lib/domain/musical-types';
interface ExercisePreviewModalProps {
    exercise: Exercise | undefined;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onStart: () => void;
}
export declare function ExercisePreviewModal({ exercise, isOpen, onOpenChange, onStart, }: ExercisePreviewModalProps): import("react/jsx-runtime").JSX.Element;
export {};
