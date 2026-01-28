# Advanced Technique Analysis Architecture

This document describes the architecture and algorithms used for high-fidelity violin technique analysis in the Violin Mentor application.

## Overview

The system transitions from simple pitch detection to a holistic technical analysis engine. It processes audio frames in real-time to identify note segments and then performs a detailed analysis of each segment to evaluate intonation, vibrato, rhythm, and tone quality.

## Data Flow

1.  **Audio Capture:** `PitchDetector` (YIN) processes audio buffers to produce `RawPitchEvent` (pitch, confidence, RMS, timestamp).
2.  **Segmentation:** `NoteSegmenter` identifies `ONSET` and `OFFSET` events using RMS and confidence thresholds with hysteresis and temporal debounce to ensure robustness.
3.  **Note Tracking:** The practice pipeline (`note-stream.ts`) aggregates frames into `NoteSegment` objects.
4.  **Technique Analysis:** `TechniqueAnalysisAgent` analyzes completed segments to generate `NoteTechnique` metrics:
    -   **Intonation:** Settling stability, global deviation, and pitch drift (via linear regression).
    -   **Vibrato:** Detection of rate (Hz), width (cents), and regularity using autocorrelation on detrended pitch data.
    -   **Attack/Release:** Calculation of attack time, pitch scoop/overshoot, and release stability.
    -   **Resonance:** Identifying "wolf-tone" like instabilities through RMS beating and pitch chaos analysis.
    -   **Transitions:** Evaluation of glissando, landing accuracy, and corrections between notes.
    -   **Rhythm:** Comparison of actual onsets and durations against a BPM-aligned expected timeline.
5.  **Observation Motor:** A prioritization system ranks technical observations, providing 2–4 actionable suggestions per session to the user.
6.  **Persistence:** Results are stored in the `AnalyticsStore` for long-term progress tracking and skill calculation.

## Metrics and Thresholds

| Metric | Target Range | Description |
| :--- | :--- | :--- |
| Vibrato Rate | 4–9 Hz | Frequency of hand oscillation. |
| Vibrato Width | 10–35 cents | Amplitude of pitch variation. |
| Pitch Drift | < 15 cents/sec | Sustained change in pitch during a note. |
| Onset Error | ±40 ms | Deviation from the expected rhythmic onset. |
| Attack Time | < 150 ms | Time to reach stable tone production. |

## Implementation Details

### Rhythm Skill
Rhythm skill is calculated based on the Mean Absolute Error (MAE) of note onsets compared to the expected timeline defined by the exercise's BPM and note durations.

### Contextual Feedback
Feedback is prioritized based on severity and confidence. To avoid cognitive overload, the system limits the number of suggestions displayed to the user during and after a session.
