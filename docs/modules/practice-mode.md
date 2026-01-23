# Practice Mode

This document describes the Practice feature of the Violin Mentor application.

## Responsibility

The Practice mode allows users to play along with sheet music and receive real-time feedback on their performance. It helps users improve their intonation and timing.

## UI Components

The UI for the Practice mode is composed of the following components:

- **`components/practice-mode.tsx`**: The main container for the Practice feature. It manages the selection of exercises and displays the `SheetMusic` and `PracticeFeedback` components.

- **`components/sheet-music.tsx`**: This component is responsible for rendering the sheet music of the selected exercise using the `opensheetmusicdisplay` library.

- **`components/practice-feedback.tsx`**: Displays real-time feedback to the user, such as whether they are playing the correct note and if it's in tune.

## State Management

The state for the Practice mode is managed by the `practice-store` Zustand store, located in `lib/stores/practice-store.ts`.

The store holds the following information:

- `exercise`: The currently selected practice exercise.
- `playbackState`: The current state of the playback (e.g., playing, paused, stopped).
- `userPerformance`: A record of the user's performance, including the notes they played and their accuracy.

The `PracticeMode` component updates the store based on user interactions and the results from the `pitch-detector`. The UI components subscribe to the store to display the relevant information.
