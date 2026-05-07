import type { Exercise } from '@/lib/domain/exercise';
interface ExerciseCardProps {
    exercise: Exercise;
    isRecommended?: boolean;
    recommendationReason?: string;
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
export declare function ExerciseCard(props: ExerciseCardProps): import("react/jsx-runtime").JSX.Element;
export {};
