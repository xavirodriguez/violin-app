/**
 * Utility functions for handling exercise data.
 */
import type { NoteDuration, Pitch } from './types';
/**
 * Calculates the duration of a note in milliseconds based on BPM.
 */
export declare const getDurationMs: (duration: NoteDuration, bpm?: number) => number;
/**
 * Parses a pitch string (e.g., "G#4", "Bb3") into a Pitch object.
 */
export declare const parsePitch: (pitchString: string) => Pitch;
