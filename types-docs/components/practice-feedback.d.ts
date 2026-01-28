/**
 * PracticeFeedback
 * Provides visual feedback to the student during an interactive practice session.
 */
import { Observation } from '@/lib/technique-types';
/**
 * Props for the PracticeFeedback component.
 */
interface PracticeFeedbackProps {
    /** The full name of the note the student should play (e.g., "G3"). */
    targetNote: string;
    /** The name of the note currently being detected by the system. */
    detectedPitchName?: string;
    /** The deviation from the ideal frequency in cents. */
    centsOff?: number | null;
    /** Current status of the practice session (e.g., 'listening', 'validating', 'correct'). */
    status: string;
    /** Current duration the note has been held steadily (in ms). */
    holdDuration?: number;
    /** Total duration the note must be held to be considered correct (in ms). */
    requiredHoldTime?: number;
    /** Technical observations for feedback. */
    observations?: Observation[];
}
/**
 * Renders feedback during the practice loop.
 */
export declare function PracticeFeedback({ targetNote, detectedPitchName, centsOff, status, holdDuration, requiredHoldTime, observations, }: PracticeFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};
