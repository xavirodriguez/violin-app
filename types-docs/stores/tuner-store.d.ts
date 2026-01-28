/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */
import { PitchDetector } from '@/lib/pitch-detector';
import { AppError } from '@/lib/errors/app-error';
/**
 * Possible states for the tuner state machine.
 * @remarks Uses a Discriminated Union to ensure that properties like `pitch` or `error`
 * are only accessible when the state machine is in the appropriate phase.
 * Transitions: IDLE -> INITIALIZING -> READY -> LISTENING <-> DETECTED
 */
type TunerState = {
    kind: 'IDLE';
} | {
    kind: 'INITIALIZING';
    token: number;
} | {
    kind: 'READY';
} | {
    kind: 'LISTENING';
    token: number;
} | {
    kind: 'DETECTED';
    pitch: number;
    note: string;
    cents: number;
    confidence: number;
    token: number;
} | {
    kind: 'ERROR';
    error: AppError;
};
/** States for microphone permission handling. */
type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED';
/**
 * Interface representing the tuner store's state and actions.
 */
interface TunerStore {
    /** The current state object of the tuner. */
    state: TunerState;
    /** Current microphone permission status. */
    permissionState: PermissionState;
    /** The pitch detection algorithm instance. */
    detector: PitchDetector | null;
    /** List of available audio input devices. */
    devices: MediaDeviceInfo[];
    /** ID of the currently selected audio input device. */
    deviceId: string | null;
    /**
     * Input sensitivity (0 to 100).
     * Maps to gain: 0 -\> 0x, 50 -\> 1x, 100 -\> 2x.
     */
    sensitivity: number;
    /** Derived getter for the current analyser. */
    analyser: AnalyserNode | null;
    /**
     * Initializes the audio pipeline and requests microphone access.
     * @remarks
     * Implements a session guard using a token to prevent race conditions
     * if multiple initializations are triggered.
     */
    initialize: () => Promise<void>;
    /** Resets the store and attempts to initialize again. */
    retry: () => Promise<void>;
    /** Stops all audio processing and releases resources. */
    reset: () => Promise<void>;
    /**
     * Updates the detected pitch and note based on new analysis results.
     * @param pitch - The detected frequency in Hz.
     * @param confidence - The confidence of the detection.
     */
    updatePitch: (pitch: number, confidence: number) => void;
    /** Transitions state to `LISTENING`. Only valid if state is `READY`. */
    startListening: () => void;
    /** Transitions state to `READY` and clears detection data. */
    stopListening: () => void;
    /**
     * Enumerates available audio input devices.
     * @remarks
     * If permission is 'PROMPT', it will trigger a brief initialization/reset cycle
     * to gain the necessary permissions to see device labels.
     */
    loadDevices: () => Promise<void>;
    /** Sets the active microphone device and re-initializes. */
    setDeviceId: (deviceId: string) => Promise<void>;
    /**
     * Sets the input sensitivity and updates the gain node immediately.
     * @param sensitivity - New sensitivity value (0-100).
     */
    setSensitivity: (sensitivity: number) => void;
}
/**
 * Hook for accessing the tuner store.
 */
export declare const useTunerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TunerStore>>;
export {};
