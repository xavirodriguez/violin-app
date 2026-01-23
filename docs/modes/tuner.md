# Tuner Mode

The Tuner Mode provides real-time pitch detection to help a user tune their violin. It displays the detected note, its frequency, and how sharp or flat it is.

**Evidence:** `components/tuner-mode.tsx`, `lib/stores/tuner-store.ts`

## Store State Machine

The behavior of the Tuner Mode is governed by the `useTunerStore`. The state machine ensures that audio resources are managed correctly and that the UI reflects the current status of the pitch detection.

| State          | Description                                                                                                                                                                                             |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `IDLE`         | The initial state. No audio resources are allocated. The user must interact to start the tuner.                                                                                                         |
| `INITIALIZING` | The store is in the process of acquiring microphone access and setting up the `AudioContext`.                                                                                                           |
| `READY`        | Audio resources are initialized, but the tuner is not yet actively processing audio. This is the baseline state when listening.                                                                         |
| `LISTENING`    | (Implicit) The component is actively listening for audio input. This is not an explicit state in the store but is the active behavior when the component is mounted and state is `READY` or `DETECTED`. |
| `DETECTED`     | A pitch with sufficient confidence (> 0.85) has been detected.                                                                                                                                          |
| `ERROR`        | An error occurred, typically due to the user denying microphone permissions.                                                                                                                            |

## Key Store Fields

| Field            | Type             | Description                                               |
| :--------------- | :--------------- | :-------------------------------------------------------- |
| `state`          | `TunerState`     | The current state of the tuner state machine.             |
| `error`          | `string \| null` | An error message if the state is `ERROR`.                 |
| `currentPitch`   | `number \| null` | The detected pitch in Hz.                                 |
| `currentNote`    | `string \| null` | The full name of the detected note (e.g., "A4").          |
| `centsDeviation` | `number \| null` | The deviation from the target pitch in cents.             |
| `confidence`     | `number`         | The confidence level of the pitch detection (0.0 to 1.0). |
| `deviceId`       | `string \| null` | The ID of the selected audio input device.                |
| `sensitivity`    | `number`         | The input gain, controlled by a slider in the UI (0-100). |

## UI Feedback

The UI component `tuner-display.tsx` renders feedback based on the store's state:

- **Note Name:** Displays `currentNote`.
- **Cents Deviation:** A visual indicator shows how sharp or flat the note is based on `centsDeviation`.
- **Confidence:** The UI only displays a note if the `confidence` is above 0.85, filtering out noise.

## Error Handling

If the user denies microphone access or if another error occurs during initialization, the store transitions to the `ERROR` state. An error message is displayed to the user with a "Retry" button, which calls the `retry()` action to attempt re-initialization.

**Evidence:** `useTunerStore.initialize`, `useTunerStore.retry` actions in `lib/stores/tuner-store.ts`.
