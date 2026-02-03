import { Observation } from '@/lib/technique-types';
interface PracticeFeedbackProps {
    targetNote: string;
    detectedPitchName?: string;
    centsOff?: number | null;
    status: string;
    centsTolerance?: number;
    liveObservations?: Observation[];
    holdDuration?: number;
    requiredHoldTime?: number;
    perfectNoteStreak?: number;
}
export declare function PracticeFeedback({ targetNote, detectedPitchName, centsOff, status, centsTolerance, liveObservations, }: PracticeFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};
