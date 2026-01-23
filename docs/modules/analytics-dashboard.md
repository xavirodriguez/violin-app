# Analytics Dashboard

This document describes the Analytics Dashboard feature of the Violin Mentor application.

## Responsibility

The Analytics Dashboard is responsible for displaying the user's practice history and progress over time. It provides visualizations of performance data to help users identify areas for improvement.

## UI Components

The UI for the Analytics Dashboard is primarily handled by the `components/analytics-dashboard.tsx` component. This component is responsible for:

- Fetching the practice data from the `analytics-store`.
- Rendering charts and statistics to visualize the data. This includes metrics such as intonation accuracy, timing accuracy, and practice frequency.

## State Management

The state for the Analytics Dashboard is managed by the `analytics-store` Zustand store, located in `lib/stores/analytics-store.ts`.

The store is responsible for:

- **Aggregating Data**: Collecting performance data from the `practice-store` after each practice session.
- **Persisting Data**: Storing the aggregated data in the browser's local storage to ensure it persists between sessions.
- **Providing Data**: Making the historical data available to the `AnalyticsDashboard` component for display.
