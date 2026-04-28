# Completed Tasks - 2025-05-22

## Summary

Completed 3 critical P0 tasks from `TASKS.md` to improve runtime safety and domain validation.

## Tasks completed

### 1. TASK-01 — Eliminar non-null assertion en `mapMatchedEvent`

- **Status:** Done
- **Files changed:**
  - `lib/errors/app-error.ts`
  - `lib/practice-engine/engine.ts`
  - `__tests__/task-01.test.ts`
- **What changed:** Replaced `payload.technique!` with explicit validation. Added `TECHNIQUE_MISSING` error code.
- **Validation:**
  - `pnpm test:unit __tests__/task-01.test.ts` — passed
  - `pnpm typecheck` — passed
- **Notes:** Function `mapMatchedEvent` was exported as `@internal` to facilitate unit testing.

### 2. TASK-02 — Crear `validateExercise()` con validación semántica completa

- **Status:** Done
- **Files changed:**
  - `lib/errors/app-error.ts`
  - `lib/exercises/validation.ts`
  - `__tests__/task-02.test.ts`
- **What changed:** Implemented `validateExercise` to check for empty notes, invalid accidentals, octave ranges, and durations. Added `INVALID_EXERCISE` error code.
- **Validation:**
  - `pnpm test:unit __tests__/task-02.test.ts` — passed
  - `pnpm typecheck` — passed
- **Notes:** Covers GAP-3 requirement for semantic validation.

### 3. TASK-03 — Integrar `validateExercise()` en `loadExercise()`

- **Status:** Done
- **Files changed:**
  - `stores/practice-store.ts`
  - `__tests__/task-03.test.ts`
- **What changed:** Updated `loadExercise` in `PracticeStore` to validate exercises before loading them into the state.
- **Validation:**
  - `pnpm test:unit __tests__/task-03.test.ts` — passed
  - `pnpm typecheck` — passed
- **Notes:** Ensures invalid exercises transition the store to an error state and prevent audio initialization.

## Validation summary

- **Passed:** All unit and integration tests for the modified files passed. Full suite passed (with pre-existing warnings in unrelated areas).
- **Failed:** None.
- **Not run:** E2E tests were not run as these are core logic changes verified by unit/integration tests.

## Follow-up recommendations

- Implement TASK-04 (Reject double accidentals in parsePitch) as it's a P1 priority.
- Implement TASK-05 and TASK-06 to finalize adaptive difficulty logic.
