# Practice Mode

The Practice Mode guides the user through a pre-defined musical exercise, providing real-time feedback on their accuracy and timing. It uses sheet music rendered by OpenSheetMusicDisplay (OSMD) to show the user which note to play.

**Evidence:** `components/practice-mode.tsx`, `lib/stores/practice-store.ts`

## Store State Machine

The `usePracticeStore` manages the complex state transitions involved in a practice session.

| State               | Description                                                                                            |
| :------------------ | :----------------------------------------------------------------------------------------------------- |
| `IDLE`              | The initial state before an exercise is chosen.                                                        |
| `LOADED`            | An exercise has been selected, but the practice session has not yet begun.                             |
| `INITIALIZING`      | The store is acquiring microphone access and setting up the `AudioContext`.                            |
| `PRACTICING`        | The session is active, and the store is listening for the user to play the current target note.        |
| `NOTE_DETECTED`     | The user is playing the correct note, but it is out of tune (cents deviation ≥ 25).                    |
| `VALIDATING`        | The user is playing the correct note in tune, and the store is waiting for the required hold duration. |
| `NOTE_COMPLETED`    | The note has been held successfully for the required duration. This is a transient state.              |
| `EXERCISE_COMPLETE` | The user has successfully completed all notes in the exercise.                                         |
| `ERROR`             | An error occurred, typically during audio initialization.                                              |

## Note Validation and Progression

For a note to be considered "complete," several conditions must be met simultaneously. This logic is handled in the `updateDetectedPitch` action.

### 1. Signal Presence

First, the system checks if there is a strong enough audio signal to analyze. This prevents background noise from being registered as a note.

| Threshold      | Value    | Purpose                                   | Evidence                                     |
| :------------- | :------- | :---------------------------------------- | :------------------------------------------- |
| **RMS**        | `> 0.01` | Filters out silence and background noise. | `updateDetectedPitch` in `practice-store.ts` |
| **Confidence** | `> 0.85` | Ensures the pitch detector is confident.  | `updateDetectedPitch` in `practice-store.ts` |

### 2. Pitch Accuracy

If a signal is present, the system checks if the played note matches the target note in the exercise.

| Threshold           | Value  | Purpose                                                | Evidence                                     |
| :------------------ | :----- | :----------------------------------------------------- | :------------------------------------------- |
| **Cents Deviation** | `< 25` | The note must be within ±25 cents of the target pitch. | `updateDetectedPitch` in `practice-store.ts` |

### 3. Hold Duration

Finally, the user must sustain the correct, in-tune note for a specific duration.

| Threshold              | Value    | Purpose                                           | Evidence                                  |
| :--------------------- | :------- | :------------------------------------------------ | :---------------------------------------- |
| **Required Hold Time** | `500` ms | Ensures the user can hold a stable, in-tune note. | `requiredHoldTime` in `practice-store.ts` |

### Progression Flow

1.  The user plays a note.
2.  If the signal is strong and the pitch is correct and in tune, the state becomes `VALIDATING`. A timer (`noteStartTime`) starts.
3.  If the user holds the note for 500ms, the state becomes `NOTE_COMPLETED`.
4.  The `advanceToNextNote` action is called, the `currentNoteIndex` is incremented, and the state returns to `PRACTICING` for the next note.
5.  If all notes are completed, the state becomes `EXERCISE_COMPLETE`.
6.  At each stage, the `useAnalyticsStore` is updated to record the attempt.
