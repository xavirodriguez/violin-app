# Domain Model

This document describes the key domain concepts and data structures used in the Violin Mentor application.

## Core Concepts

### Musical Note

A `MusicalNote` is a fundamental concept in the application, representing a single musical note. The implementation can be found in `lib/musical-note.ts`.

- **Properties**: A `MusicalNote` has properties such as `name` (e.g., "A4"), `frequency` (in Hz), and `octave`.
- **Functionality**: The `MusicalNote` class provides methods to:
  - Create a note from a given frequency.
  - Calculate the distance (in cents) from another note, which is crucial for intonation feedback.

### Pitch Detection

Pitch detection is the process of identifying the fundamental frequency of a sound.

- **Algorithm**: The application uses the **YIN algorithm**, implemented in `lib/pitch-detector.ts`, for real-time pitch detection from microphone input.
- **Output**: The pitch detector outputs the detected frequency in Hz and a `confidence` level, indicating the certainty of the detection. This information is used to create a `MusicalNote` object for further processing.

### Practice Exercises

Practice exercises are structured musical pieces that users can play along with.

- **Format**: Exercises are stored as **MusicXML** files in the `public/assets/musicxml/` directory. MusicXML is a standard format for representing sheet music.
- **Loading**: The `lib/exercises/musicxml-loader.ts` is responsible for fetching and parsing these MusicXML files.
- **Structure**: Each exercise has associated metadata, such as title and difficulty, defined in `lib/exercises/violin-etudes.ts`.

## State Management

The application's state is managed using Zustand stores, which are located in `lib/stores/`.

- **`tuner-store`**: Holds the state for the Tuner mode, including the currently detected note and its frequency.
- **`practice-store`**: Manages the state for the Practice mode, such as the loaded exercise, the user's performance, and feedback.
- **`analytics-store`**: Aggregates and stores data from practice sessions to be displayed on the dashboard.
