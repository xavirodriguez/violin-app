import { DetectedNote } from './practice-core';
import { Observation } from './technique-types';
/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * Processes high-frequency pitch data into actionable pedagogical advice.
 * Limited to the top 2 most relevant observations by severity and confidence.
 *
 * @param recentDetections - Chronological detections (newest first).
 * @param targetPitch - Target scientific pitch name (e.g., "A4").
 * @returns Prioritized {@link Observation} objects.
 *
 * @public
 */
export declare function calculateLiveObservations(recentDetections: readonly DetectedNote[], targetPitch: string): Observation[];
