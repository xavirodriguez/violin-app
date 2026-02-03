import type { Exercise } from '@/lib/domain/musical-types';
interface ExerciseCardProps {
    exercise: Exercise;
    isRecommended?: boolean;
    lastAttempt?: {
        accuracy: number;
        timestamp: number;
    };
    onClick: () => void;
    isSelected: boolean;
}
/**
 * Visual card representing a violin exercise with OSMD preview.
 */
export declare function ExerciseCard({ exercise, isRecommended, lastAttempt, onClick, isSelected, }: ExerciseCardProps): import("react/jsx-runtime").JSX.Element;
export {};
