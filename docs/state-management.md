# State Management in Violin Mentor

Violin Mentor uses [Zustand](https://github.com/pmndrs/zustand) for state management. The application's state is divided into three separate stores, each corresponding to one of the main modes of the application. This modular approach keeps the state for each mode isolated and easier to manage.

## Store Map

| Store               | File Location                   | Responsibilities                                                                                             |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `useTunerStore`     | `lib/stores/tuner-store.ts`     | Manages the state for the **Tuner Mode**, including audio initialization, pitch detection, and UI feedback.  |
| `usePracticeStore`  | `lib/stores/practice-store.ts`  | Manages the state for the **Practice Mode**, including exercise loading, note validation, and user progress. |
| `useAnalyticsStore` | `lib/stores/analytics-store.ts` | Manages user analytics and progress data, including session tracking, streaks, and achievements.             |

## `useTunerStore`

The `useTunerStore` is responsible for:

- Initializing and managing the `AudioContext` and `AnalyserNode`.
- Handling microphone permissions and device selection.
- Storing the detected pitch, note name, cents deviation, and confidence level.
- Managing the state machine for the tuner (e.g., `IDLE`, `LISTENING`, `DETECTED`).

## `usePracticeStore`

The `usePracticeStore` is responsible for:

- Loading and managing the current practice exercise.
- Tracking the user's progress through the exercise (e.g., `currentNoteIndex`).
- Validating the user's performance against the target note, including in-tune thresholds and hold duration.
- Managing the state machine for the practice session (e.g., `PRACTICING`, `VALIDATING`, `NOTE_COMPLETED`).

## `useAnalyticsStore`

The `useAnalyticsStore` is responsible for:

- Recording and storing practice session data.
- Calculating user statistics, such as streaks, accuracy, and practice time.
- Persisting user progress to local storage using Zustand's `persist` middleware.

## Cross-Store Interactions

The stores are largely independent, but there is one key interaction:

- `usePracticeStore` calls `useAnalyticsStore` to record note attempts and session data. This is done by directly calling the actions of the `useAnalyticsStore` from within the `usePracticeStore`.
