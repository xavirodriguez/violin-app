# ADR 003: Validated Persistence with Zod

## Status
Accepted

## Context
Zustand's `persist` middleware does not validate the data rehydrated from `localStorage`. Changes in state structure could lead to runtime errors or data corruption when loading old versions of the state.

## Decision
We implemented a `validatedPersist` middleware that wraps Zustand's `persist`. It uses Zod schemas to validate the state during rehydration. If validation fails, it logs an error and can optionally reset or migrate the state.

## Consequences
- Guaranteed runtime type safety for persisted data.
- Safer deployments of state changes.
- Clearer path for state migrations.
