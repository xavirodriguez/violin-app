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
 * The TunerStore manages the state of the standalone violin tuner. It handles:
 * - **Permission Lifecycle**: Tracks microphone authorization states.
 * - **Signal Analysis**: Interfaces with `PitchDetector` to extract note and deviation.
 * - **Device Management**: Allows selection and enumeration of audio input hardware.
 * - **Gain Control**: Adjusts sensitivity to match different environments.
 *
 * It uses a session token pattern to handle race conditions during asynchronous initialization.
 *
 * @public
 */
export declare const useTunerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TunerStore>>;
