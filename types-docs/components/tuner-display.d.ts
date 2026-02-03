/**
 * TunerDisplay
 * A visual representation of the tuner state, including a needle meter and note info.
 */
/**
 * Props for the TunerDisplay component.
 */
interface TunerDisplayProps {
    /** The musical name of the detected note (e.g., "A4"). */
    note: string | null;
    /** The deviation from the ideal frequency in cents. */
    cents: number | null;
    /** The confidence level of the pitch detection (0-1). */
    confidence: number;
}
/**
 * Renders the tuner's main visual feedback.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the note name, cents deviation, and a meter.
 *
 * @remarks
 * Features:
 * - Real-time needle movement based on `cents`.
 * - Color-coded zones (green for in-tune, yellow for close, red for far).
 * - Accessibility: Includes a screen-reader-only live region for pitch updates.
 */
export declare function TunerDisplay({ note, cents, confidence }: TunerDisplayProps): import("react/jsx-runtime").JSX.Element;
export {};
