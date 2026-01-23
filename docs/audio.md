# Audio Processing Pipeline

The core of Violin Mentor's functionality is its real-time audio processing pipeline, which captures microphone input, analyzes it, and detects the musical pitch. This process is designed to be efficient and accurate, running entirely in the user's browser.

**Evidence:** `lib/pitch-detector.ts`, `lib/stores/tuner-store.ts`, `lib/stores/practice-store.ts`

## 1. Initialization

The audio pipeline is initialized when the user enters Tuner or Practice mode for the first time.

1.  **Requesting Permissions:** The application calls `navigator.mediaDevices.getUserMedia({ audio: ... })` to request microphone access. This must be triggered by a user interaction (e.g., clicking a "Start" button).
2.  **Creating `AudioContext`:** Upon successful permission grant, a new `AudioContext` is created. This is the central hub for managing and processing audio in the Web Audio API.
3.  **Creating Nodes:**
    - A `MediaStreamSource` is created from the microphone's audio stream.
    - An `AnalyserNode` is created to perform a Fast Fourier Transform (FFT) on the audio data, which is necessary for frequency analysis. The `fftSize` is set to `2048` samples, providing a good balance between frequency resolution and latency.
    - In Tuner Mode, a `GainNode` is added to allow the user to adjust the input sensitivity.

4.  **Connecting the Pipeline:** The nodes are connected in the following order:
    `MediaStreamSource` → `GainNode` (Tuner only) → `AnalyserNode`

## 2. Pitch Detection Loop

Once initialized, the application runs a continuous loop to detect the pitch in real-time. This is typically handled within a `requestAnimationFrame` loop in the UI components.

1.  **Get Float Time Domain Data:** In each frame, the `analyser.getFloatTimeDomainData(buffer)` method is called. This fills a `Float32Array` buffer with the current audio waveform data.
2.  **Calculate RMS:** The Root Mean Square (RMS) of the buffer is calculated using the `PitchDetector.calculateRMS()` method. This is a measure of the signal's volume. If the RMS is below a threshold (`0.01`), the frame is treated as silence, and no pitch detection is performed. This is a critical step for filtering out background noise.
3.  **Detect Pitch:** If the signal is strong enough, the buffer is passed to the `PitchDetector.detectPitch()` method. This method implements the **YIN algorithm** to find the fundamental frequency (the pitch) of the audio.
4.  **Return Result:** The `detectPitch` method returns a `PitchDetectionResult` object containing:
    - `pitchHz`: The detected frequency in Hz.
    - `confidence`: A value from 0.0 to 1.0 representing the algorithm's confidence.

## 3. The `PitchDetector` Class

The `PitchDetector` class (`lib/pitch-detector.ts`) is a custom, pure-JavaScript implementation of the YIN algorithm.

### Key Parameters

| Parameter       | Value    | Description                                                                                                                          |
| :-------------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| `MIN_FREQUENCY` | `180` Hz | The minimum frequency the detector will look for. Set just below the violin's lowest note (G3, ~196 Hz).                             |
| `MAX_FREQUENCY` | `700` Hz | The maximum frequency the detector will look for. This focuses the detector on the practical range for beginner violinists.          |
| `YIN_THRESHOLD` | `0.10`   | The YIN algorithm's confidence threshold. A lower value is stricter, reducing false positives but potentially missing quieter notes. |

### Confidence and Noise/Silence Treatment

The application uses two primary mechanisms to handle noise and silence:

1.  **RMS Threshold:** As mentioned above, an RMS value below `0.01` is considered silence, and the processing stops for that frame.
2.  **Confidence Threshold:** The result from the pitch detector is only considered valid if the `confidence` level is greater than `0.85`. This ensures that ambiguous or noisy signals do not result in incorrect feedback to the user.

These two thresholds work together to ensure that the user only receives feedback when they are playing a clear, detectable note.
