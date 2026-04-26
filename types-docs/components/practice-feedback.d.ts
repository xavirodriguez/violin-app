import { Observation } from '@/lib/technique-types';
/**
 * Props for the {@link PracticeFeedback} component.
 *
 * @public
 */
export interface PracticeFeedbackProps {
    /** The scientific pitch name of the target note (e.g., "A4"). */
    targetNote: string;
    /** The scientific pitch name detected by the audio engine. */
    detectedPitchName: string | undefined;
    /** Pitch deviation in cents from the target note's ideal frequency. */
    centsOff: number | undefined;
    /** Current status of the practice state machine. */
    status: string;
    /** Maximum allowed deviation in cents to be considered "in tune". */
    centsTolerance?: number;
    /** List of real-time technical observations. */
    liveObservations?: Observation[];
    /** Duration the current note has been held correctly in tune (ms). */
    holdDuration?: number;
    /** Required hold time for a note to be considered successfully matched (ms). */
    requiredHoldTime?: number;
    /** Current count of consecutive notes played with high accuracy. */
    perfectNoteStreak?: number;
}
/**
 * Component that provides real-time pedagogical feedback during a practice session.
 */
export declare function PracticeFeedback(props: PracticeFeedbackProps): import("react/jsx-runtime").JSX.Element;
