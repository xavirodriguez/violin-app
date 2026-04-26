/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */
import type { TunerStore } from '@/lib/domain/musical-types';
/**
 * Zustand hook for accessing the TunerStore.
 *
 * @remarks
 * The TunerStore manages the state of the standalone violin tuner. It is designed
 * for high-frequency updates and robust hardware orchestration.
 *
 * **Core Responsibilities**:
 * - **Permission Lifecycle**: Tracks and triggers microphone authorization states.
 * - **Signal Analysis**: Interfaces with `PitchDetector` to extract note and deviation.
 * - **Device Management**: Allows selection and enumeration of audio input hardware.
 * - **Gain Control**: Adjusts sensitivity to match different environments (quiet rooms vs. loud studios).
 *
 * **Concurrency & Safety**:
 * It uses an internal `initToken` pattern to handle race conditions during asynchronous
 * initialization. If `initialize()` is called multiple times, only the result of the
 * latest call is applied to the store.
 *
 * @example
 * ```ts
 * const { state, initialize, updatePitch } = useTunerStore();
 * ```
 *
 * @public
 */
export declare const useTunerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TunerStore>>;
