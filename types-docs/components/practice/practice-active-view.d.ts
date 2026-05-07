import type { TargetNote, DetectedNote } from '@/lib/domain/practice';
import type { Observation } from '@/lib/technique-types';
/**
 * View displaying real-time feedback and fingerboard visualization during practice.
 */
export declare function PracticeActiveView({ status, targetNote, targetPitchName, lastDetectedNote, liveObservations, holdDuration, perfectNoteStreak, zenMode, centsTolerance, }: {
    status: string;
    targetNote: TargetNote | undefined;
    targetPitchName: string | undefined;
    lastDetectedNote: DetectedNote | undefined;
    liveObservations?: Observation[];
    holdDuration?: number;
    perfectNoteStreak?: number;
    zenMode: boolean;
    centsTolerance?: number;
}): import("react/jsx-runtime").JSX.Element;
