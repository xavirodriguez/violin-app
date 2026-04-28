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

### 4. TASK-04 — Hacer que `parsePitch` rechace accidentales dobles

- **Status:** Done
- **Files changed:**
  - `lib/exercises/utils.ts`
  - `lib/exercises/utils.test.ts`
- **What changed:** Updated `parsePitch` to explicitly reject `##` and `bb` using `AppError` and `ERROR_CODES.NOTE_PARSING_FAILED`.
- **Validation:**
  - `pnpm test:unit lib/exercises/utils.test.ts` — passed
- **Notes:** Added specific test cases for double accidental rejection.

### 5. TASK-05 — Añadir floor de 15 cents en `calculateCentsTolerance()`

- **Status:** Done
- **Files changed:**
  - `stores/practice-store.ts`
  - `__tests__/task-05.test.ts`
- **What changed:** Implemented a 15 cents floor in the store's adaptive tolerance calculation.
- **Validation:**
  - `pnpm test:unit __tests__/task-05.test.ts` — passed
- **Notes:** Exported `calculateCentsTolerance` as `@internal` for unit testing.

### 6. TASK-06 — Conectar `perfectNoteStreak` real a `calculateAdaptiveDifficulty()`

- **Status:** Done
- **Files changed:**
  - `lib/practice-engine/engine.ts`
  - `__tests__/task-06.test.ts`
- **What changed:** Connected the real-time streak to difficulty adjustments and unified the floor at 15 cents in the engine.
- **Validation:**
  - `pnpm test:unit __tests__/task-06.test.ts` — passed
- **Notes:** Exported `calculateAdaptiveDifficulty` as `@internal` for unit testing.

## Final Validation Summary

- **Typecheck:** `pnpm typecheck` — passed
- **Unit Tests:** `pnpm test:unit` — all 243 tests passed.
- **Pre-commit:** All checks completed.
