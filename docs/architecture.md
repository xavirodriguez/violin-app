# Architecture

This document provides a high-level overview of the Violin Mentor application's architecture.

## System Context

Violin Mentor is a client-side, single-page application (SPA) built with Next.js. It runs entirely in the user's browser and does not have a dedicated backend server. The application uses the browser's microphone to capture audio input for real-time pitch detection.

## Components

The application is structured into several key components:

- **`app/page.tsx`**: The main entry point of the application. It manages the active mode (Tuner, Practice, or Dashboard) and renders the appropriate component.

- **`components/tuner-mode.tsx`**: The UI for the Tuner feature, which provides real-time pitch detection and feedback. It relies on the `TunerDisplay` component to visualize the detected frequency.

- **`components/practice-mode.tsx`**: The UI for the Practice feature. It displays sheet music using the `SheetMusic` component and provides feedback on the user's playing.

- **`components/analytics-dashboard.tsx`**: The UI for the Dashboard, which shows the user's progress and practice history.

- **`lib/pitch-detector.ts`**: Contains the implementation of the YIN algorithm for pitch detection. This is the core of the real-time feedback system.

- **`lib/stores/`**: Zustand stores are used to manage the application's state. There are separate stores for the tuner, practice mode, and analytics.

## Data Flow

1.  **Audio Input**: The application requests microphone access from the user. Audio is captured using the browser's `AudioContext`.

2.  **Pitch Detection**: The raw audio data is passed to the `pitch-detector.ts` module, which processes it and returns the detected frequency.

3.  **State Update**: The detected frequency is used to update the `tuner-store` or `practice-store`, depending on the current mode.

4.  **UI Render**: The UI components, subscribed to the Zustand stores, re-render to reflect the new state. For example, the `TunerDisplay` will update to show the new note and frequency.

5.  **Analytics**: Practice data, such as note accuracy and timing, is collected and stored in the `analytics-store`. This data is then displayed in the `AnalyticsDashboard`.

## External Services

The application does not rely on any external backend services for its core functionality. It is a self-contained client-side application. The only external dependency is the use of Vercel for deployment and analytics.
