/**
 * PracticeMode
 *
 * The main container component for the interactive practice session.
 * It orchestrates exercise selection, audio processing, sheet music rendering,
 * and real-time feedback.
 */
/**
 * Main component for the Interactive Practice Mode.
 *
 * @remarks
 * This component is the primary entry point for the practice experience. It coordinates:
 * 1. **Exercise Management**: Loading, previewing, and selecting exercises from the library.
 * 2. **Audio Pipeline**: Orchestrates the `createPracticeEventPipeline` which connects
 *    raw audio frames to musical domain events.
 * 3. **Real-time Visualization**: Synchronizes progress with `SheetMusic` (via OSMD)
 *    and provides feedback through the `ViolinFingerboard`.
 * 4. **User Interaction**: Manages keyboard shortcuts (Space for Start/Stop, Z for Zen Mode)
 *    and UI layout toggles.
 *
 * It relies on the `usePracticeStore` for centralized state and the `useOSMDSafe` hook
 * for robust notation rendering.
 *
 * @public
 */
export declare function PracticeMode(): import("react/jsx-runtime").JSX.Element;
