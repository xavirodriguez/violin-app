/**
 * SheetMusicDisplay
 * A high-level component for displaying sheet music with configurable options.
 */
import { IOSMDOptions } from 'opensheetmusicdisplay';
/**
 * Props for the SheetMusicDisplay component.
 */
interface SheetMusicDisplayProps {
    /** The MusicXML string to be rendered. */
    musicXML: string;
    /** Initial configuration options for OSMD. */
    initialOptions?: IOSMDOptions;
}
/**
 * Renders a sheet music display with a toggle for dark mode.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the sheet music and controls.
 *
 * @remarks
 * This component demonstrates how to use the `useOSMDSafe` hook and
 * provides a simple UI to interact with OSMD options.
 */
export declare function SheetMusicDisplay({ musicXML, initialOptions }: SheetMusicDisplayProps): import("react/jsx-runtime").JSX.Element;
export {};
