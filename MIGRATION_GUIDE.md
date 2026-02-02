# Migration Guide: Refactoring to Hexagonal Architecture

## Overview
We have refactored the codebase to move from a monolithic store-based architecture to a more decoupled Ports and Adapters architecture.

## Changes

### 1. Analytics Store Decomposition
The monolithic `AnalyticsStore` has been split into:
- `useSessionStore`: Active session data.
- `useProgressStore`: Cumulative stats (persisted).
- `useAchievementsStore`: Unlocked medals (persisted).
- `useSessionHistoryStore`: Past practice records (persisted).

**Compatibility:** A `useAnalyticsStore` facade exists in `stores/analytics-facade.ts` for legacy code. New components should use the specific stores.

### 2. Practice Store State Machine
`PracticeStore` now uses a `state` object with a `status` discriminator.
**Legacy:** `const isStarting = usePracticeStore(s => s.isStarting)`
**New:** `const status = usePracticeStore(s => s.state.status); const isStarting = status === 'initializing'`

### 3. Audio Ports
Direct access to `AnalyserNode` or `AudioContext` in business logic is deprecated. Use `AudioFramePort` and `AudioLoopPort`.

### 4. Persistence Validation
Persistence now requires a Zod schema. If you add new properties to a persistent store, you **must** update the corresponding schema in `lib/schemas/persistence.schema.ts`.

## Step-by-Step Migration for Components
1. Identify if the component uses `useAnalyticsStore`.
2. Check if it needs session, progress, or achievement data.
3. Replace imports with the specific store (e.g., `useProgressStore`).
4. Update state access (e.g., `progress.totalPracticeTime` instead of `analytics.progress.totalPracticeTime`).
