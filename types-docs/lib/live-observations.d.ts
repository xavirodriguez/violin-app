import { DetectedNote } from './practice-core';
import { Observation } from './technique-types';
/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * This module transforms high-frequency, raw pitch data into actionable pedagogical advice
 * for the student. It focuses on identifying immediate technical issues that can be
 * corrected during the performance of a single note.
 *
 * **Observation Heuristics**:
 * 1. **Intonation**: Analyzes average cent deviation for "sharp" or "flat" patterns.
 * 2. **Stability**: Measures the standard deviation of pitch to detect wavering.
 * 3. **Accuracy**: Detects if the student is playing the wrong note entirely.
 * 4. **Tone Quality**: Uses detection confidence as a proxy for signal clarity.
 * Limited to the top 2 most relevant observations by severity and confidence.
 *
 * @param recentDetections - Chronological detections (newest first).
 * @param targetPitch - Target scientific pitch name (e.g., "A4").
 * @returns Prioritized {@link Observation} objects.
 *
 * @public
 */
export declare function calculateLiveObservations(recentDetections: readonly DetectedNote[], targetPitch: string): Observation[];
