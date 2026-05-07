/**
 * TunerDisplay
 * A visual representation of the tuner state, including a needle meter and note info.
 */
/**
 * Props for the TunerDisplay component.
 */
interface TunerDisplayProps {
    /** The musical name of the detected note (e.g., "A4"). */
    note: string | undefined;
    /** The deviation from the ideal frequency in cents. */
    cents: number | undefined;
    /** The confidence level of the pitch detection (0-1). */
    confidence: number;
}
/**
 * Renders the tuner's main visual feedback.
 */
export declare function TunerDisplay(props: TunerDisplayProps): import("react/jsx-runtime").JSX.Element;
export {};
