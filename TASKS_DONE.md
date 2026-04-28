# Completed Tasks - 2025-05-22

## Summary

Completed 3 critical tasks from `TASKS.md` to improve engine robustness, verify system invariants, and ensure pipeline consistency.

## Tasks completed

### 1. TASK-07 — Test de integración de dificultad adaptativa end-to-end

- **Status:** Done
- **Files changed:**
  - `lib/practice-engine/engine.ts`
  - `__tests__/task-07.test.ts`
- **What changed:** Created a comprehensive integration test for adaptive difficulty. Exposed internal `updateState` and `getOptions` methods in `PracticeEngine` (as `@internal`) to allow state simulation in tests.
- **Validation:**
  - `pnpm test:unit __tests__/task-07.test.ts` — passed
- **Notes:** Verified that tolerance decreases and hold time increases based on `perfectNoteStreak`, and respects system boundaries.

### 2. TASK-20 — Crear suite de invariantes críticos

- **Status:** Done
- **Files changed:**
  - `__tests__/invariants.test.ts`
- **What changed:** Implemented a dedicated test suite to protect critical system invariants, including `YIN_THRESHOLD`, `MIN_FREQUENCY`, strict pitch matching rules, and adaptive difficulty bounds.
- **Validation:**
  - `pnpm test:unit __tests__/invariants.test.ts` — passed
- **Notes:** Ensures that future changes do not accidentally degrade the core engine logic or pedagogical fairness.

### 3. TASK-10 — Mantener coherencia entre `minRms` del pipeline y del segmenter

- **Status:** Done
- **Files changed:**
  - `lib/note-stream.ts`
  - `__tests__/task-10.test.ts`
- **What changed:** Updated `createSegmenter` to programmatically enforce the invariant `minRms(note-stream) < minRms(NoteSegmenter)`. Exported `createSegmenter` as `@internal` for verification.
- **Validation:**
  - `pnpm test:unit __tests__/task-10.test.ts` — passed
- **Notes:** If pipeline `minRms` is 0.01, segmenter uses 0.015. For custom values, it uses a 1.5x multiplier.

## Previous Tasks (Completed in earlier sessions)

### TASK-01 — Eliminar non-null assertion en `mapMatchedEvent`
- **What changed:** Replaced `payload.technique!` with explicit validation. Added `TECHNIQUE_MISSING` error code.

### TASK-02 — Crear `validateExercise()` con validación semántica completa
- **What changed:** Implemented `validateExercise` to check for empty notes, invalid accidentals, octave ranges, and durations. Added `INVALID_EXERCISE` error code.

### TASK-03 — Integrar `validateExercise()` en `loadExercise()`
- **What changed:** Updated `loadExercise` in `PracticeStore` to validate exercises before loading.

### TASK-04 — Hacer que `parsePitch` rechace accidentales dobles
- **What changed:** Updated `parsePitch` to explicitly reject `##` and `bb`.

### TASK-05 — Añadir floor de 15 cents en `calculateCentsTolerance()`
- **What changed:** Implemented a 15 cents floor in the store's adaptive tolerance calculation.

### TASK-06 — Conectar `perfectNoteStreak` real a `calculateAdaptiveDifficulty()`
- **What changed:** Connected the real-time streak to difficulty adjustments and unified the floor at 15 cents in the engine.

## Final Validation Summary

- **Typecheck:** `pnpm typecheck` — passed
- **Unit Tests:** `pnpm test:unit` — all 255 tests passed.
- **Pre-commit:** All checks completed.
