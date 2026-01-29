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
 */
export declare function PracticeMode(): import("react/jsx-runtime").JSX.Element;
