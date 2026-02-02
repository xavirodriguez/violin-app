/**
 * Audio Manager
 *
 * Infrastructure layer for managing Web Audio API resources.
 * Encapsulates the complexity of initialization, resource tracking, and cleanup.
 */
export interface AudioResources {
    context: AudioContext;
    stream: MediaStream;
    analyser: AnalyserNode;
    gainNode?: GainNode;
}
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
    getContext(): AudioContext | null;
    getStream(): MediaStream | null;
    getAnalyser(): AnalyserNode | null;
    setGain(value: number): void;
    isActive(): boolean;
}
/**
 * Singleton instance of the AudioManager to be used across the application.
 */
export declare const audioManager: AudioManager;
