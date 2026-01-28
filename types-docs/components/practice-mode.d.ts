/**
 * PracticeMode
 * The main container component for the interactive practice session.
 * It orchestrates exercise selection, audio processing, sheet music rendering,
 * and real-time feedback.
 */
/**
 * Renders the practice interface and manages its complex lifecycle.
 *
 * @remarks
 * State flow:
 * - `idle`: Shows exercise selector and "Start" button.
 * - `listening`: Audio loop is active, providing real-time feedback.
 * - `completed`: Shows success state and option to restart.
 *
 * Side effects:
 * - Initializes the default exercise on mount.
 * - Synchronizes the OSMD cursor with the current note index from the practice store.
 * - Manages audio resource lifecycle via the `usePracticeStore` actions.
 *
 * Performance:
 * - Uses `useOSMDSafe` to efficiently manage sheet music rendering.
 */
export declare function PracticeMode(): import("react/jsx-runtime").JSX.Element;
