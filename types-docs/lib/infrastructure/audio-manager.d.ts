/**
 * Audio Manager
 *
 * Infrastructure layer for managing Web Audio API resources.
 * Encapsulates the complexity of initialization, resource tracking, and cleanup.
 */
/**
 * Collection of Web Audio resources managed by the {@link AudioManager}.
 *
 * @public
 */
export interface AudioResources {
    /** The primary Web Audio API context. */
    context: AudioContext;
    /** The raw media stream from the input device (microphone). */
    stream: MediaStream;
    /** The analyser node used for pitch detection and visualization. */
    analyser: AnalyserNode;
    /** Optional gain node for sensitivity adjustment. */
    gainNode?: GainNode;
}
/**
 * Service for managing hardware-level Web Audio API resources.
 *
 * @remarks
 * This class encapsulates the lifecycle of the `AudioContext` and `MediaStream`.
 * It provides a singleton interface to ensure that only one microphone handle
 * is active at any given time, preventing resource leaks and hardware conflicts.
 *
 * **Resource Lifecycle**:
 * 1. **Initialize**: Acquires microphone access and creates the audio graph.
 * 2. **Cleanup**: Disconnects all nodes and closes the audio context.
 *
 * @public
 */
export declare class AudioManager {
    private context;
    private stream;
    private analyser;
    private source;
    private gainNode;
    /**
     * Initializes the audio pipeline.
     *
     * @param deviceId - Optional ID of the microphone to use.
     * @returns A promise that resolves to the initialized audio resources.
     * @throws AppError if microphone access is denied or hardware fails.
     */
    initialize(deviceId?: string): Promise<AudioResources>;
    /**
     * Releases all audio resources and closes the context.
     */
    cleanup(): Promise<void>;
    /**
     * Retrieves the current Web Audio context.
     * @returns The active `AudioContext` or `undefined` if not initialized.
     */
    getContext(): AudioContext | undefined;
    /**
     * Retrieves the raw microphone media stream.
     * @returns The active `MediaStream` or `undefined` if not initialized.
     */
    getStream(): MediaStream | undefined;
    /**
     * Retrieves the shared AnalyserNode for signal analysis.
     * @returns The active `AnalyserNode` or `undefined` if not initialized.
     */
    getAnalyser(): AnalyserNode | undefined;
    /**
     * Adjusts the input sensitivity by setting the gain node value.
     *
     * @param value - Gain value (usually 0.0 to 2.0).
     */
    setGain(value: number): void;
    /**
     * Checks if the audio pipeline is currently running.
     * @returns `true` if context is initialized and not closed.
     */
    isActive(): boolean;
    private acquireMicStream;
    private getAudioConstraints;
    private initializeContextNodes;
    private buildAudioGraph;
    private getAudioResources;
    private stopMediaTracks;
    private disconnectAudioNodes;
    private closeAudioContext;
    private resetResourceReferences;
}
/**
 * Singleton instance of the AudioManager to be used across the application.
 */
export declare const audioManager: AudioManager;
