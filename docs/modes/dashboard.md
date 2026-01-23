# Dashboard Mode

The Dashboard Mode provides the user with insights into their practice history, progress over time, and achievements. All data is managed by the `useAnalyticsStore` and is persisted to the user's local storage.

**Evidence:** `components/analytics-dashboard.tsx`, `lib/stores/analytics-store.ts`

## Data Persistence

The `useAnalyticsStore` uses Zustand's `persist` middleware to save the `sessions` and `progress` state to local storage under the key `violin-analytics`. This ensures that the user's practice history is not lost between sessions.

## Session Recording

A `PracticeSession` is recorded every time the user completes a practice exercise. The process is as follows:

1.  **Start Session:** When the `start()` action is called in the `usePracticeStore`, it also calls `useAnalyticsStore.getState().startSession()`. This creates a new `currentSession` object with a start time and the exercise details.
2.  **Record Attempts:** During the practice session, `usePracticeStore` calls `recordNoteAttempt` and `recordNoteCompletion` in the analytics store to track the user's performance on each note.
3.  **End Session:** When the exercise is completed or stopped, `usePracticeStore` calls `useAnalyticsStore.getState().endSession()`. This calculates the final session metrics (duration, accuracy, etc.), updates the user's overall progress, and adds the completed session to the historical list of sessions.

## Key Metrics and Data

The following key metrics are tracked and displayed on the dashboard:

| Metric                  | Description                                                                     | Evidence                         |
| :---------------------- | :------------------------------------------------------------------------------ | :------------------------------- |
| **Total Practice Time** | The cumulative time the user has spent in practice sessions.                    | `progress.totalPracticeTime`     |
| **Total Sessions**      | The total number of practice sessions completed.                                | `progress.totalPracticeSessions` |
| **Accuracy**            | The percentage of notes played in tune during a session.                        | `session.accuracy`               |
| **Intonation Skill**    | A calculated skill level (0-100) based on the accuracy of the last 10 sessions. | `calculateIntonationSkill()`     |
| **Current Streak**      | The number of consecutive days the user has practiced.                          | `progress.currentStreak`         |
| **Longest Streak**      | The user's all-time longest practice streak.                                    | `progress.longestStreak`         |

## Streak Computation

The practice streak is updated at the end of each session. The logic is as follows:

- If the last practice session was yesterday, the `currentStreak` is incremented.
- If the last practice session was before yesterday, the `currentStreak` is reset to `1`.
- If this is the first session, the `currentStreak` starts at `1`.
- The `longestStreak` is updated whenever the `currentStreak` surpasses it.

**Evidence:** `endSession` action in `lib/stores/analytics-store.ts`

## Achievements

The system includes a simple achievement system. After each session, the `checkAchievements` function runs to see if the user has unlocked any new achievements.

| Achievement             | Condition                                          |
| :---------------------- | :------------------------------------------------- |
| **First Perfect Scale** | Complete an exercise with 100% accuracy.           |
| **7-Day Streak**        | Achieve a 7-day practice streak.                   |
| **100 Notes Mastered**  | Successfully play a cumulative total of 100 notes. |

**Evidence:** `checkAchievements()` function in `lib/stores/analytics-store.ts`
