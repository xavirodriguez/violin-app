# Violin Mentor Architecture

This document provides a high-level overview of the Violin Mentor application's architecture, its core components, and the flow of data through the system.

## Core Technologies

- **Frontend Framework:** [Next.js](https://nextjs.org/) (with React)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) built on [Radix UI](https://www.radix-ui.com/) and styled with [Tailwind CSS](https://tailwindcss.com/)
- **Pitch Detection:** A custom implementation of the YIN algorithm, located in `lib/pitch-detector.ts`.
- **Sheet Music Rendering:** [OpenSheetMusicDisplay (OSMD)](https://opensheetmusicdisplay.org/)

## System Architecture

Violin Mentor is a client-side, single-page application (SPA) with three primary modes: **Tuner**, **Practice**, and **Dashboard**. The architecture is designed to process audio in real-time and provide immediate visual feedback to the user.

### Runtime Boundaries

- **Client-Side Audio Processing:** All audio processing, from capturing microphone input to pitch detection, occurs entirely in the user's browser. This is handled by the `PitchDetector` class and the Web Audio API.
- **UI Layer:** The UI is built with React components and is responsible for rendering the application's state and handling user interactions.
- **State Layer:** The application's state is managed by three separate Zustand stores, each corresponding to one of the application's modes.

## Data Flow

The primary data flow in the application follows these steps:

1.  **Microphone Input:** The application requests microphone access from the user. Once granted, an `AudioContext` is created to process the audio stream.
2.  **Audio Analysis:** An `AnalyserNode` from the Web Audio API processes the audio stream, providing real-time frequency data.
3.  **Pitch Detection:** The `PitchDetector` class takes the frequency data from the `AnalyserNode` and uses the YIN algorithm to detect the fundamental frequency (pitch) of the audio.
4.  **State Update:** The detected pitch and confidence level are passed to the active Zustand store (`useTunerStore` or `usePracticeStore`).
5.  **UI Feedback:** The UI components subscribe to the Zustand stores and re-render to display the updated information (e.g., the current note, cents deviation, or practice feedback).
6.  **Analytics:** In Practice Mode, the results of each note attempt are recorded in the `useAnalyticsStore`, which persists the user's progress to local storage.

## Mode Switching

The application's three modes are controlled by the main component in `app/page.tsx`. A state variable (`mode`) determines which of the three main components is rendered:

- `<TunerMode />`
- `<PracticeMode />`
- `<AnalyticsDashboard />`

Each of these components is responsible for its own logic and state, which is managed by its corresponding Zustand store. This separation of concerns makes it easy to manage the complexity of each mode independently.
