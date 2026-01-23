# Tuner Mode

This document describes the Tuner feature of the Violin Mentor application.

## Responsibility

The Tuner mode is responsible for providing real-time pitch detection and feedback to the user. It helps violinists tune their instrument by showing the currently played note and how sharp or flat it is.

## UI Components

The UI for the Tuner mode is primarily composed of two components:

- **`components/tuner-mode.tsx`**: The main container for the Tuner feature. It orchestrates the audio processing and displays the `TunerDisplay` component.

- **`components/tuner-display.tsx`**: This component is responsible for visualizing the pitch detection results. It shows:
  - The name of the detected note (e.g., "A4").
  - The frequency of the note in Hz.
  - A visual indicator of how close the user is to the correct pitch.

## State Management

The state for the Tuner mode is managed by the `tuner-store` Zustand store, located in `lib/stores/tuner-store.ts`.

The store holds the following information:

- `note`: The currently detected `MusicalNote` object.
- `frequency`: The detected frequency in Hz.
- `confidence`: The confidence level of the pitch detection.

The `TunerMode` component updates this store with the results from the `pitch-detector`, and the `TunerDisplay` component subscribes to the store to display the data.
