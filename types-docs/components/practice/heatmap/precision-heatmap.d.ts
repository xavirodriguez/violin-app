import React from 'react';
import { ScoreViewPort } from '@/lib/ports/score-view.port';
interface PrecisionHeatmapProps {
    exerciseId: string;
    scoreView: ScoreViewPort;
    containerRef: React.RefObject<HTMLDivElement | null>;
    applyHeatmap: (precisionMap: Record<number, number>) => void;
}
export declare function PrecisionHeatmap({ exerciseId, scoreView, containerRef, applyHeatmap }: PrecisionHeatmapProps): null;
export {};
