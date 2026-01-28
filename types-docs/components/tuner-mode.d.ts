/**
 * TunerMode
 * Provides the user interface for the violin tuner.
 * Handles the audio analysis loop and visualizes pitch detection results.
 */
/**
 * Main component for the Tuner mode.
 *
 * @remarks
 * Side Effects:
 * - Manages an animation frame loop that calls the `detector` on every frame
 *   to analyze audio from the `analyser`.
 * - Updates the `useTunerStore` with the latest detected pitch and confidence.
 * - Cleans up the animation frame on unmount or when the audio loop stops.
 *
 * State Flow:
 * - `IDLE`: Initial state, shows a "Start" button.
 * - `INITIALIZING`: Waiting for microphone permission and audio context setup.
 * - `READY`/`LISTENING`/`DETECTED`: Audio loop is active, showing the fingerboard and tuning info.
 * - `ERROR`: Audio setup failed, shows an error message and retry option.
 */
export declare function TunerMode(): import("react/jsx-runtime").JSX.Element;
