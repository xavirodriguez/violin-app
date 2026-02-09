import { Observation } from '@/lib/technique-types';
/**
 * Props for the {@link PracticeFeedback} component.
 */
interface PracticeFeedbackProps {
    /** The scientific pitch name of the target note (e.g., "A4"). */
    targetNote: string;
    /** The scientific pitch name detected by the audio engine, if any. */
    detectedPitchName: string | null;
    /** Pitch deviation in cents from the target note's ideal frequency. */
    centsOff: number | null;
    /** Current status of the practice machine (e.g., 'listening', 'correct'). */
    status: string;
    /** Maximum allowed deviation in cents to be considered "in tune". Defaults to 10. */
    centsTolerance?: number;
    /** List of real-time technical observations (intonation, stability, etc.) to display. */
    liveObservations?: Observation[];
    /** Duration the current note has been held correctly in tune, in milliseconds. */
    holdDuration?: number;
    /** Required hold time for a note to be considered successfully matched. */
    requiredHoldTime?: number;
    /** Current count of consecutive notes played with perfect accuracy. */
    perfectNoteStreak?: number;
}
/**
 * Component that provides real-time visual feedback during a practice session.
 *
 * @remarks
 * This component implements a multi-level feedback system designed to guide
 * students without overwhelming them:
 *
 * 1. **Primary Status (60% visual weight)**: Large indicators for "Perfect", "Wrong Note", or "Adjust" (arrows).
 * 2. **Technical Details (Collapsible)**: Provides exact cents deviation for advanced students.
 * 3. **Pedagogical Observations**: Displays high-level tips (e.g., "Consistently sharp")
 *    derived from long-term analysis of the current note.
 *
 * @param props - Component props.
 * @public
 */
export declare function PracticeFeedback({ targetNote, detectedPitchName, centsOff, status, centsTolerance, liveObservations, }: PracticeFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};
