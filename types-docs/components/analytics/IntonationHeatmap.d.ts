import { ExerciseStats } from '@/lib/domain/practice';
interface IntonationHeatmapProps {
    exerciseStats: Record<string, ExerciseStats>;
}
/**
 * Visualizes pitch accuracy patterns for all exercises in a heatmap grid.
 * Refactored to satisfy Senior Software Craftsmanship 5-15 line limits.
 */
export declare function IntonationHeatmap({ exerciseStats }: IntonationHeatmapProps): import("react/jsx-runtime").JSX.Element;
export {};
