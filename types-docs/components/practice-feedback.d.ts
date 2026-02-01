import { Observation } from '@/lib/technique-types';
interface PracticeFeedbackProps {
    targetNote: string;
    detectedPitchName?: string;
    centsOff?: number | null;
    status: string;
    liveObservations?: Observation[];
    /** The allowable pitch deviation in cents for a note to be considered "In Tune". @defaultValue 25 */
    centsTolerance?: number;
}
export declare function PracticeFeedback({ targetNote, detectedPitchName, centsOff, status, liveObservations, centsTolerance, }: PracticeFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};
