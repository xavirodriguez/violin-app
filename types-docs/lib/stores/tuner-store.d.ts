/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */
import { PitchDetector } from '@/lib/pitch-detector';
import { AppError } from '@/lib/errors/app-error';
/** Possible states for the tuner state machine. */
type TunerState = 'IDLE' | 'INITIALIZING' | 'READY' | 'LISTENING' | 'DETECTED' | 'ERROR';
/** States for microphone permission handling. */
type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED';
/**
 * Interface representing the tuner store's state and actions.
 *
 * @remarks
 * State machine:
 * - `IDLE` -\> `INITIALIZING` -\> `READY` when `initialize()` is called.
 * - `READY` -\> `LISTENING` when `startListening()` is called.
 * - `LISTENING` to/from `DETECTED` based on whether a clear pitch is found.
 *
 * Error handling:
 * - Errors during initialization transition the state to `ERROR`.
 * - `retry()` can be used to attempt initialization again.
 */
interface TunerStore {
    /** The current high-level state of the tuner. */
    state: TunerState;
    /** Current microphone permission status. */
    permissionState: PermissionState;
    /** Detailed error object if the state is `ERROR`. */
    error: AppError | null;
    /** The detected frequency in Hz. */
    currentPitch: number | null;
    /** The musical name of the detected pitch (e.g., "A4"). */
    currentNote: string | null;
    /** Deviation from the ideal pitch in cents. */
    centsDeviation: number | null;
    /**
     * Confidence level of the pitch detection (0 to 1).
     * Typically \> 0.85 is considered a reliable signal.
     */
    confidence: number;
    /** The Web Audio API context. */
    audioContext: AudioContext | null;
    /** AnalyserNode for frequency analysis. */
    analyser: AnalyserNode | null;
    /** The media stream from the microphone. */
    mediaStream: MediaStream | null;
    /** The audio source node created from the media stream. */
    source: MediaStreamAudioSourceNode | null;
    /** The pitch detection algorithm instance. */
    detector: PitchDetector | null;
    /** Gain node to control input sensitivity. */
    gainNode: GainNode | null;
    /** List of available audio input devices. */
    devices: MediaDeviceInfo[];
    /** ID of the currently selected audio input device. */
    deviceId: string | null;
    /**
     * Input sensitivity (0 to 100).
     * Maps to gain: 0 -\> 0x, 50 -\> 1x, 100 -\> 2x.
     */
    sensitivity: number;
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
