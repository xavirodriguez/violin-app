import { DetectedNote } from './practice-core';
import { Observation } from './technique-types';
/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * This function provides immediate pedagogical feedback to the student while they are
 * actively playing. It analyzes patterns in the audio stream to detect:
 * 1. **Persistent Intonation Errors**: Detects if the user is consistently sharp or flat.
 * 2. **Pitch Stability**: Identifies "jitter" or wavering in the pitch, often due to bow pressure or finger tension.
 * 3. **Note Accuracy**: Flags when the user is playing a completely different note than intended.
 * 4. **Tone Quality**: Uses confidence metrics to infer clarity of tone.
 *
 * It uses a sliding window of recent frames (minimum 5) to ensure high confidence in its findings.
 *
 * @param recentDetections - Readonly array of recently detected notes/frames from the pipeline.
 * @param targetPitch - The scientific pitch name (e.g., "A4") of the currently practiced note.
 * @returns An array of {@link Observation} objects, prioritized and limited to the top 2 most relevant ones.
 *
 * @public
 */
export declare function calculateLiveObservations(recentDetections: readonly DetectedNote[], targetPitch: string): Observation[];
