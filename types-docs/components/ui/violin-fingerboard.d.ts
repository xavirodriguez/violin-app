/**
 * ViolinFingerboard
 * A visual representation of a violin fingerboard using HTML5 Canvas.
 * It provides real-time feedback on finger placement for both target and detected notes.
 */
/**
 * Props for the ViolinFingerboard component.
 */
interface ViolinFingerboardProps {
    /** The note the student should be playing (e.g., "A4"). */
    targetNote: string | null;
    /** The note currently detected by the pitch tracker. */
    detectedPitchName: string | null;
    /** The deviation in cents from the ideal frequency. Used for visual offset. */
    centsDeviation: number | null;
    /** The tolerance in cents within which a note is considered "In Tune". @defaultValue 25 */
    centsTolerance?: number;
    /** Explicit override for the in-tune state. */
    isInTune?: boolean;
}
/**
 * Renders a visual representation of a violin fingerboard on a `<canvas>`.
 *
 * @param props - Component properties.
 * @returns A JSX element containing two layered canvases (base and overlay).
 *
 * @remarks
 * Architectural Pattern:
 * - Uses a dual-canvas strategy:
 *   1. `baseCanvas`: Renders the static fingerboard and strings once.
 *   2. `overlayCanvas`: Renders dynamic indicators (target/detected notes) on every update.
 * - This optimizes performance by avoiding full redraws of the complex fingerboard background.
 *
 * Interaction:
 * - Shows a blue circle for the `targetNote` with the required finger number.
 * - Shows a green (in-tune) or red (out-of-tune) circle for the `detectedPitchName`.
 * - The horizontal position of the detected note is shifted based on `centsDeviation`.
 */
export declare function ViolinFingerboard({ targetNote, detectedPitchName, centsDeviation, centsTolerance, isInTune, }: ViolinFingerboardProps): import("react/jsx-runtime").JSX.Element;
export {};
