/**
 * TunerMode
 *
 * Provides the user interface for the standalone violin tuner.
 * Handles the audio analysis loop and visualizes pitch detection results.
 */
/**
 * Main component for the Standalone Tuner Mode.
 *
 * @remarks
 * This component provides a focused interface for tuning the violin strings. It manages its own
 * high-frequency analysis loop using `requestAnimationFrame` when the tuner is active.
 *
 * **Key Features**:
 * 1. **Visual Tuning**: Displays a high-accuracy `ViolinFingerboard` with cents deviation indicators.
 * 2. **Audio Lifecycle**: Manages the start/stop of the analyzer loop and synchronizes with the `TunerStore`.
 * 3. **Error Resilience**: Handles microphone access errors and provides a specialized retry mechanism.
 * 4. **State Orchestration**: Uses a formal state machine from the store to handle UI transitions (IDLE, INITIALIZING, READY, LISTENING, ERROR).
 *
 * **Performance**: The analysis loop pulls raw PCM samples and runs the pitch detection algorithm
 * every animation frame (approx. 16ms). The `updatePitch` action in the store is optimized for
 * this frequency.
 *
 * @example
 * ```tsx
 * <TunerMode />
 * ```
 *
 * @example
 * ```tsx
 * <TunerMode />
 * ```
 *
 * @public
 */
export declare function TunerMode(): import("react/jsx-runtime").JSX.Element;
