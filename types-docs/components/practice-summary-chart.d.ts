interface NoteAttempt {
    noteIndex: number;
    targetPitch: string;
    accuracy: number;
    cents: number;
}
interface PracticeSummaryChartProps {
    noteAttempts: NoteAttempt[];
}
/**
 * Visual summary of exercise performance with accuracy heatmap.
 */
export declare function PracticeSummaryChart({ noteAttempts }: PracticeSummaryChartProps): import("react/jsx-runtime").JSX.Element | null;
export {};
