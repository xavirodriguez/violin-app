/**
 * TunerStore
 *
 * This module provides a Zustand store for the violin tuner.
 * It manages the audio pipeline for real-time pitch detection, microphone permissions,
 * and device selection.
 */
import type { TunerStore } from '@/lib/domain/musical-types';
/**
 * Hook for accessing the tuner store.
 */
export declare const useTunerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<TunerStore>>;
