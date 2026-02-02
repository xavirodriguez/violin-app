# Violin Mentor

An interactive violin training application with real-time pitch detection, guided practice exercises, and progress analytics.

## What is Violin Mentor?

Violin Mentor helps violinists improve their intonation and practice skills through three integrated modes:

1. **Tuner Mode**: Real-time pitch detection to tune your violin
2. **Practice Mode**: Guided exercises with interactive sheet music and real-time feedback
3. **Analytics Dashboard**: Track your progress, streaks, and achievements

## Architecture

The project follows a **Hexagonal Architecture (Ports and Adapters)** to ensure maintainability and testability:

- **Domain Layer**: Contains pure business logic, musical types, and state transitions.
- **Application Layer (Stores)**: Manages application state using Zustand. Decomposed into specialized stores (Practice, Session, Progress, Achievements).
- **Infrastructure Layer (Ports & Adapters)**: Abstractions for Web APIs (Audio, Storage).
- **UI Layer**: React components that consume stores and ports.

### Key Technical Features

- **Decoupled Audio**: Audio processing is abstracted via `AudioPort`, allowing for browser-less testing.
- **State Machine**: `PracticeStore` uses explicit states (Discriminated Unions) to prevent invalid states.
- **Safe Persistence**: All persisted state is validated at runtime using Zod schemas.
- **Cancelable Sessions**: Practice sessions use `AbortController` for clean resource cleanup and concurrency.
