interface HeatmapSectionProps {
    data: Array<{
        noteIndex: number;
        targetPitch: string;
        accuracy: number;
        cents: number;
    }>;
}
export declare function HeatmapSection(props: HeatmapSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
