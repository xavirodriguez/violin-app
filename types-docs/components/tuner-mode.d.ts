/**
 * TunerMode
 *
 * Provides the user interface for the violin tuner.
 * Handles the audio analysis loop and visualizes pitch detection results.
 */
/**
 * Main component for the Standalone Tuner Mode.
 *
 * @remarks
 * This component provides a focused interface for tuning the violin. It manages its own
 * high-frequency analysis loop using `requestAnimationFrame` when active.
 *
 * Key features:
 * 1. **Visual Tuning**: Displays a high-accuracy fingerboard with cents deviation.
 * 2. **Audio Lifecycle**: Manages the start/stop of the analyzer loop and synchronization with `TunerStore`.
 * 3. **Error Resilience**: Handles microphone access errors and provides retry mechanisms.
 * 4. **Hardware Selection**: Integrates with the store's device enumeration (via settings).
 *
 * @public
 */
export declare function TunerMode(): import("react/jsx-runtime").JSX.Element;
